var _ = require('underscore');
var CronJob = require('cron').CronJob;
var async = require('async');
var Listing = require('../models/Listing');
var User = require('../models/User');
var Run = require('../models/Run');
var amazonProvider = require('../lib/amazonApiProvider');
var ebayProvider = require('../lib/ebayApiProvider');
var utils = require('../lib/utils');

var PAYPAL_FIXED_FEE = 0.3;
var EBAY_AND_PAYPAL_FEE_PERCENT = 0.871;
var processItem = function(item, userSettings, listing) {
    var result = {};
    var quantity = item.OfferSummary.TotalNew;
    item.Offers.Offer = utils.ensureArray(item.Offers.Offer);
    var listingPrice = listing.data.StartPrice;
    var price = item.Offers.Offer[0].OfferListing.Price.Amount;
    price = (price /100).toFixed(2);
    var calculatedPrice = (price * userSettings.percent + PAYPAL_FIXED_FEE)/ EBAY_AND_PAYPAL_FEE_PERCENT;
    var priceWithMinMargin = parseInt(price) + userSettings.marginMinimum;
    calculatedPrice = calculatedPrice.toFixed(2);

    if (parseInt(calculatedPrice) !== parseInt(listingPrice)) {
        result.price = (calculatedPrice > priceWithMinMargin)? calculatedPrice : priceWithMinMargin;
        result.action = 'Revision';
    }
    if ((quantity <= userSettings.mininumQuantity || item.Offers.Offer[0].OfferListing.IsEligibleForPrime == '0') && (listing.data.Quantity != 0)) {
        result.quantity = '0';
        result.action = 'outOfStock';
    }

    if (!_.isEmpty(result)) {
        result.itemId = listing.itemId;
    }

    return result;
};

var scanListings = function() {
    User.find({}, function (err, users) {
        if (err) {
            console.error('Error reading from User table');
            return;
        }
        console.log('+++Started monitor run!+++');
        var activeUsers = _.where(users, {active: true});
        _.each(activeUsers, function(user) {
            Listing.find({$and: [{ user_id: user.id}, { status: 'LISTED'}]}, function(err, listings) {
                if (err) {
                    console.error('Error reading from Listing table with user: ' + user.id);
                    return;
                }
                var asins = _.pluck(listings, 'asin');
                var userSettings = {
                    percent: 1 + (user.settings.marginPercent/100),
                    marginMinimum: user.settings.marginMinimum,
                    mininumQuantity: user.settings.mininumQuantity
                };

                amazonProvider.getItemsFromAmazon(asins, function(items) {
                    if (_.isEmpty(items)) {
                        return;
                    }
                    var itemsSummary = _.map(items, function(item) {
                        var listing = _.findWhere(listings, {asin: item.ASIN});
                        return processItem(item, userSettings, listing);
                    });
                    itemsSummary = _.filter(itemsSummary, function(item) { return !_.isEmpty(item)});
                    var ebayToken = _.findWhere(user.get('tokens'), {kind: 'ebay'}).accessToken;
                    ebayProvider.reviseMultipleInventoryStatus(ebayToken, itemsSummary, function(ebayErrors) {
                        var endedItemErrorCode = 21916750;
                        var revisions = [];
                        var errors = [];
                        _.each(ebayErrors, function(ebayError) {
                            var itemId = ebayError.ErrorParameters.Value;
                            itemsSummary = _.filter(itemsSummary, function(item) {return item.itemId != itemId;});
                            var errorListing = _.findWhere(listings, {itemId: itemId});
                            if (ebayError.ErrorCode == endedItemErrorCode) {
                                errorListing.status = 'UNLISTED';
                            }
                            var error = {
                                itemId: errorListing.itemId,
                                asin: errorListing.asin,
                                ebayError: ebayError.LongMessage,
                                ebayErrorCode: ebayError.ErrorCode

                            };
                            errors.push(error);
                        });

                        _.each(itemsSummary, function(revisedItem) {
                            var revisedListing = _.findWhere(listings, {itemId: revisedItem.itemId});
                            var oldPrice = revisedListing.data.StartPrice;
                            revisedListing.data.StartPrice = revisedItem.price;
                            revisedListing.data.Quantity = revisedItem.quantity || revisedListing.data.Quantity;
                            var revision = {
                                itemId: revisedListing.itemId,
                                asin: revisedListing.asin,
                                oldPrice: oldPrice,
                                newPrice: revisedListing.data.StartPrice,
                                quantity: revisedItem.quantity,
                                action: revisedItem.action
                            };
                            revisions.push(revision);
                        });
                        var run = new Run({
                            userId: user.id,
                            listings: listings.length,
                            revisions: revisions,
                            ebayErrors: ebayErrors
                        });
                        async.mapLimit(listings, 10, function(document, next){
                            document.save(next);
                        }, function() {
                            run.save();
                            console.log('+++Finished monitor run for user: ' + user.id +'!+++');
                        });
                    });
                });
            });
        });
    });
};
var job = new CronJob({
    cronTime: '*/10 * * * *',
    onTick: scanListings,
    start: true,
    timeZone: 'America/Los_Angeles'
});
job.start();


