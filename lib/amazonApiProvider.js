var secrets = require('../config/secrets');
var User = require('../models/User');
var request = require('request');
var _ = require('underscore');
var async = require('async');
var utils = require('../lib/utils');
var OperationHelper = require('apac').OperationHelper;

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

exports.itemLookup = itemLookup;



