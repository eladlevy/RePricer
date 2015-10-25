var secrets = require('../config/secrets');
var User = require('../models/User');
var request = require('request');
var _ = require('underscore');
var async = require('async');
var utils = require('../lib/utils');
var OperationHelper = require('apac').OperationHelper;
var Xray = require('x-ray');
var x = Xray();


var opHelper = new OperationHelper({
    awsId:     secrets.amazon.awsId,
    awsSecret: secrets.amazon.awsSecret,
    assocId:   'aa',
    xml2jsOptions:{
        attrkey: '@',
        charkey: '#text',
        explicitArray: false
    },// an extra, optional, parameter for if you want to pass additional options for the xml2js module. (see https://github.com/Leonidas-from-XIV/node-xml2js#options)
    version:   '2013-08-01'
    // your version of using product advertising api, default: 2013-08-01
});

var itemLookup = function(id, callback) {
    console.log('Calling amazon itemLookup with asins:' + id);
    opHelper.execute('ItemLookup', {
        IdType: 'ASIN',
        ItemId: id,
        ResponseGroup: 'ItemAttributes,Offers,Images,EditorialReview,BrowseNodes'
    }, function(err, results) { // you can add a third parameter for the raw xml response, "results" here are currently parsed using xml2js
        var responseObject = results['ItemLookupResponse'];
        callback(responseObject);
    });
};

var itemScrape = function(id, callback) {
    var amazonUrl = 'http://www.amazon.com/gp/offer-listing/' + id + '/?ie=UTF8&condition=new&shipPromoFilter=1';
    var proxy = '';
    request.get({
        url: amazonUrl,
        headers: {
            'User-Agent' : ''
        },
        proxy: proxy
    }, function(error, response, body) {
        if (error) return callback(error);
        x(body, {
            body: 'body@html',
            offers: x('.olpOffer', [{
                price: '.olpOfferPrice',
                delivery: '.olpFastTrack .a-list-item'
            }])
        })(function(err, response) {
            if(err) return callback(err);
            var offers = response.offers;
            console.log('Scrape response for ASIN: ' + id);
            console.log('Number of offers found: ' + offers.length);
            if (response.body.indexOf('To discuss automated access to Amazon data') != -1) {
                console.log('Amazon detected bot :(');
            } else {
                console.log('We\'re good :)');
            }

            if (offers.length > 0) {
                offers = _.map(offers, function(offer) {
                    offer.price = offer.price.trim().substring(1);
                    offer.delivery = offer.delivery.trim().replace(/(\r\n|\n|\r)/gm,"");
                    offer.inStock = (offer.delivery.indexOf('In Stock.') != -1);
                    offer.asin = id;
                    return offer;
                });
                var bestOffers = _.where(offers, {inStock: true});
                if (bestOffers.length > 0) {
                    return callback(null, bestOffers[0]);
                } else {
                    return callback(null, {inStock: false, asin: id});
                }
            } else {
                return callback(null, {inStock: false, asin: id});
            }
        });
    })
};

exports.getItemsFromAmazon = function(asins, callback) {
    var MAX_PER_AMAZON_CALL = 10;
    var asinsLists = utils.chunk(asins, MAX_PER_AMAZON_CALL);
    var callArray = [];
    _.each(asinsLists, function(asinsBatch) {
        callArray.push(function(asyncCallback) {
            itemLookup(asinsBatch.join(','), function(data) {
                asyncCallback(null, data);
            });
        });
    });
    async.series(callArray, function(err, result) {
        if (err) {
            console.log('Error fetching from Amazon');
            return;
        }

        var allAmazonItems = [];
        _.each(result, function(responseBatch) {
            var amazonItems = utils.ensureArray(responseBatch && responseBatch.Items.Item);
            allAmazonItems = allAmazonItems.concat(amazonItems)
        });
        callback(allAmazonItems);
    });
};

exports.scrapeItemsFromAmazon = function(asins, callback) {
    var callArray = [];
    _.each(asins, function(asin) {
        callArray.push(function(asyncCallback) {
            itemScrape(asin, function(err, data) {
                if (err) return asyncCallback(err);
                asyncCallback(null, data);
            });
        });
    });

    async.parallelLimit(callArray, 10,function(err, result) {
        if (err) {
            console.log('Error fetching from Amazon: ' + err);
            return;
        }
        callback(result);
    });

};

exports.itemLookup = itemLookup;


