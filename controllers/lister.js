var secrets = require('../config/secrets');
var User = require('../models/User');
var Listing = require('../models/Listing');
var async = require('async');
var amazonProvider = require('../lib/amazonApiProvider');
var ebayProvider = require('../lib/ebayApiProvider');
var querystring = require('querystring');
var request = require('request');
var _ = require('underscore');

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

var buildDescription = function(features, description) {
    var featureList = '';
    description = description || {Content: ''};
    _.each(features, function(feature) {
       featureList +=  '<li>' + feature + '</li>';
    });
    var html = description.Content + '<br><br>' +
            '<h2>Product Features</h2>' +
            '<ul>' + featureList + '</ul>';

    return html;
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
    var data = {
        Title: amazonAttributes.ItemAttributes.Title.substring(0, MAX_TITLE_LIMIT),
        //Quantity: amazonAttributes.ItemAttributes.PackageQuantity,
        Description: buildDescription(amazonAttributes.ItemAttributes.Feature, description),
        StartPrice: '300.0',
        PictureDetails: {
            PictureURL: _.pluck(_.pluck(amazonAttributes.ImageSets.ImageSet.slice(0, MAX_IMAGES_LIMIT), 'LargeImage'), 'URL')
        },
        ItemSpecifics:{
            NameValueList: buildItemSpecifics(amazonAttributes.ItemAttributes)
        },
        PrimaryCategory: {CategoryID: amazonAttributes.categoryId || '377'}
    };

    listing.data = _.extend(listing.data, data);
};

var startListing = function(user) {
    Listing.find({$and: [{ user_id: user.id}, { status: 'PENDING'}]}, function(err, docs) {
        var MAX_PER_EBAY_CALL = 5;
        var MAX_PER_AMAZON_CALL = 10;
        var asinsLists = chunk(_.pluck(docs, 'asin'), MAX_PER_AMAZON_CALL);

        var callArray = [];
        _.each(asinsLists, function(asinsBatch) {
            callArray.push(function(callback) {
                amazonProvider.itemLookup(asinsBatch.join(','), function(data) {
                    callback(null, data);
                });
            });
        });

        async.series(callArray, function(err, result) {
            if (err) {
                console.log('Error fetching from Amazon');
                return;
            }

            result = _.flatten(result);
            var allAmazonItems = [];
            _.each(result, function(responseBatch) {
                var amazonItems = ensureArray(responseBatch && responseBatch.Items.Item);
                allAmazonItems = allAmazonItems.concat(amazonItems)
            });

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
    var userId = req.user.id;
    Listing.find({ 'user_id': userId }, function (err, docs) {
        if (err) {
            next(err);
        }

        res.render('listings', {
            title: 'Listings',
            listings: docs
        });
    });
};

exports.getAmazonListing = function(req, res) {
    var asin = req.params.asin;
    var ebayToken = _.findWhere(req.user.get('tokens'), {kind: 'ebay'}).accessToken;
    amazonProvider.itemLookup(asin, function(data) {
        var attributes = JSON.parse(data);
        var ebayListingKeys = {
            Title: attributes.ItemAttributes.Title.substring(0, 80),
            Description: attributes.ItemAttributes.Feature.join(' '),
            StartPrice: '300.0',
            PictureDetails: {
                PictureURL: _.pluck(_.pluck(attributes.ImageSets.ImageSet, 'LargeImage'), 'URL')
            }
        };
        if (ebayToken) {
            ebayProvider.addItem(ebayToken, ebayListingKeys,function(err, data) {
                res.send(data);
            });
        } else {
            res.send('No ebay access token');
        }
    });
};
//
//exports.getAmazonListing = function(req, res) {
//    var asin = req.params.asin;
//    var ebayToken = _.findWhere(req.user.get('tokens'), {kind: 'ebay'}).accessToken;
//    //if (ebayToken) {
//    //    ebayProvider.addItem(ebayToken, function(err, data) {
//    //        res.send(data);
//    //    });
//    //} else {
//    //    res.send('No ebay access token');
//    //}
//
//    amazonProvider.itemLookup(asin, function(data) {
//        res.send(data);
//    });
//};