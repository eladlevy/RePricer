var secrets = require('../config/secrets');
var User = require('../models/User');
var Listing = require('../models/Listing');
var async = require('async');
var amazonProvider = require('../lib/amazonApiProvider');
var ebayProvider = require('../lib/ebayApiProvider');
var querystring = require('querystring');
var hbs = require('express-handlebars').create();
var request = require('request');
var _ = require('underscore');

var descriptionTemplate;
hbs.getPartials().then(function (partials) {
    descriptionTemplate = partials.listingDescription;
});

var chunk = function(arr, chunkSize) {
    arr = arr || [];
    var lists = _.chain(arr).groupBy(function(element, index) {
        return Math.floor(index/chunkSize);
    }).toArray().value();
    return lists;
};

var ensureArray = function(obj) {
    return _.isUndefined(obj) ? [] : (_.isArray(obj) ? obj : [ obj ]);
};

var buildDescription = function(features, description, title, images) {
    var ctx = {};
    description = description || {Content: ''};
    ctx.title = title;
    ctx.features = ensureArray(features);
    ctx.description = description.Content;
    ctx.image = images[0];
    return descriptionTemplate(ctx);
};

var buildItemSpecifics = function(itemAttributes) {
    var keys = ['Brand', 'UPC', 'Color', 'Size'];
    var result = [];
    _.each(keys, function(key) {
        if (itemAttributes[key]) {
            result.push({
                Name: key,
                Value: itemAttributes[key]
            });
        }
    });

    return result;
};

var mapToEbayKeys = function(listing, amazonAttributes) {
    var MAX_TITLE_LIMIT = 80;
    var MAX_IMAGES_LIMIT = 11;
    amazonAttributes.ImageSets = amazonAttributes.ImageSets || {ImageSet: []};
    amazonAttributes.ImageSets.ImageSet = ensureArray(amazonAttributes.ImageSets.ImageSet);
    amazonAttributes.EditorialReviews = amazonAttributes.EditorialReviews || {};
    amazonAttributes.EditorialReviews.EditorialReview = ensureArray(amazonAttributes.EditorialReviews.EditorialReview);
    var description = _.findWhere(amazonAttributes.EditorialReviews.EditorialReview, {Source: 'Product Description'});
    var title = amazonAttributes.ItemAttributes.Title.substring(0, MAX_TITLE_LIMIT);
    var images = _.pluck(_.pluck(amazonAttributes.ImageSets.ImageSet.slice(0, MAX_IMAGES_LIMIT), 'LargeImage'), 'URL').reverse();
    var data = {
        Title: title,
        //Quantity: amazonAttributes.ItemAttributes.PackageQuantity,
        Description: buildDescription(amazonAttributes.ItemAttributes.Feature, description, title, images),
        StartPrice: '300.0',
        Quantity: '0',
        PictureDetails: {
            PictureURL: images
        },
        ItemSpecifics:{
            NameValueList: buildItemSpecifics(amazonAttributes.ItemAttributes)
        },
        PrimaryCategory: {CategoryID: amazonAttributes.categoryId || '377'}
    };
    listing.data = _.defaults(data, listing.toObject().data || {});
};

var startListing = function(user) {
    Listing.find({$and: [{ user_id: user.id}, { status: 'PENDING'}]}, function(err, docs) {
        var MAX_PER_EBAY_CALL = 5;
        var asinsLists = _.pluck(docs, 'asin');

        var callArray = [];
        amazonProvider.getItemsFromAmazon(asinsLists, function(allAmazonItems) {
            var invalidListings = _.difference(_.pluck(docs, 'asin'), _.pluck(allAmazonItems, 'ASIN'));
            _.each(invalidListings, function(invalidASIN) {
                var listing  = _.findWhere(docs, {asin: invalidASIN});
                listing.status = 'INVALID_ASIN';
            });

            //Find categories
            callArray = [];
            var ebayToken = _.findWhere(user.get('tokens'), {kind: 'ebay'}).accessToken;
            _.each(allAmazonItems, function(item) {
                callArray.push(function(callback) {
                    item.BrowseNodes.BrowseNode = ensureArray(item.BrowseNodes.BrowseNode);
                    var query = item.BrowseNodes.BrowseNode[0].Name + ' ' + item.ItemAttributes.Title;
                    ebayProvider.findCategory(ebayToken, query, function(err, data) {
                        var categoryId;
                        if (data.CategoryCount > 0) {
                            data.SuggestedCategoryArray.SuggestedCategory = ensureArray(data.SuggestedCategoryArray.SuggestedCategory);
                            categoryId = data.SuggestedCategoryArray.SuggestedCategory[0].Category.CategoryID;
                            item.categoryId = categoryId;
                        }
                        callback(null, data);
                    });
                });
            });

            async.parallel(callArray, function(err, result) {
                if (err) {
                    console.log('Error finding category');
                    return;
                }

                _.each(allAmazonItems, function(item) {
                    var listing  = _.findWhere(docs, {asin: item.ASIN});
                    mapToEbayKeys(listing, item);
                });

                var itemsList = chunk(_.where(docs, {status: 'PENDING'}), MAX_PER_EBAY_CALL);

                callArray = [];
                _.each(itemsList, function(itemsBatch) {
                    callArray.push(function(callback) {
                        ebayProvider.addItems(ebayToken, itemsBatch,function(err, data) {
                            callback(null, data);
                        });
                    });
                });

                async.parallel(callArray, function(err, result) {
                    if (err) {
                        console.log('Error listing in Ebay');
                        return;
                    }
                    result = _.flatten(result);
                    _.each(result, function(responseBatch) {
                        if (!responseBatch) return;
                        responseBatch.AddItemResponseContainer = ensureArray(responseBatch.AddItemResponseContainer);
                        _.each(responseBatch.AddItemResponseContainer, function(itemResponse) {
                            itemResponse.Errors = ensureArray(itemResponse.Errors);
                            var errors = _.where(itemResponse.Errors, {SeverityCode: 'Error'});
                            errors = _.map(errors, function(currentObject) {
                                return _.pick(currentObject, 'ErrorCode', 'ShortMessage');
                            });
                            var listing = _.findWhere(docs, {id: itemResponse.CorrelationID});
                            if (!_.isEmpty(errors)) {
                                listing.ebayErrors = errors;
                                listing.status = 'LISTING_ERROR';
                            } else {
                                listing.itemId = itemResponse.ItemID;
                                listing.status = 'LISTED';
                            }
                        });
                    });

                    _.each(docs, function(listing) {
                        listing.save(function(err) {
                            console.log(err);
                        });
                    });
                });
            });
        });
    });
};

exports.getLister = function(req, res) {
    res.render('lister', {
        title: 'Lister'
    });
};

exports.postLister = function(req, res) {
    req.assert('asins', 'Please insert at least one ASIN number').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/lister');
    }

    var asinsArray = req.body.asins.replace(/(\r\n|\n|\r|,)/gm," ").replace(/\s\s+/g, ' ').split(" ");
    var userId = req.user.id;
    var listings = _.map(asinsArray, function(asin) {
        return {
            asin: asin,
            user_id: userId,
            status: 'PENDING',
            data: {
                PayPalEmailAddress: req.user.email
            }
        }
    });

    Listing.create(listings, function(err, listingItems) {
        startListing(req.user);
        req.flash('success', { msg: asinsArray.length + ' items queued for listing!' });
        res.render('lister', {
            title: 'Lister'
        });
    });
};

exports.getListings = function(req, res, next) {
    res.render('listings', {
        title: 'Listings'
    });
};

exports.getSettings = function(req, res, next) {
    res.render('settings', {
        title: 'Settings'
    });
};

exports.postRelist = function(req, res, next) {
    req.assert('listingId', 'Margin percent can\'t be empty').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/listings');
    }

    Listing.findById(req.body.listingId, function(err, listing) {
        if (err) return next(err);
        listing.status = 'PENDING';
        listing.save(function(err) {
            if (err) return next(err);
            req.flash('success', { msg: 'Item pending to be listed' });
            res.redirect('/listings');
            startListing(req.user);
        });
    });
};

exports.postSettings = function(req, res, next) {
    req.assert('marginPercent', 'Margin percent can\'t be empty').notEmpty();
    req.assert('marginMinimum', 'Minimum margin can\'t be empty').notEmpty();
    req.assert('handelingTime', 'Handeling time can\'t be empty').notEmpty();
    req.assert('itemQuantity', 'Item quantity time can\'t be empty').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/settings');
    }

    User.findById(req.user.id, function(err, user) {
        if (err) return next(err);
        user.settings.marginPercent = req.body.marginPercent;
        user.settings.marginMinimum = req.body.marginMinimum;
        user.settings.handelingTime = req.body.handelingTime;
        user.settings.itemQuantity = req.body.itemQuantity;
        user.save(function(err) {
            if (err) return next(err);
            req.user = user;
            req.flash('success', { msg: 'Settings saved!' });
            res.redirect('/settings');
        });
    });
};
