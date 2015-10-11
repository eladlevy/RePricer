var secrets = require('../config/secrets');
var User = require('../models/User');
var request = require('request');
var _ = require('underscore');
var amazon = require('../lib/amazon-product-api');

var client = amazon.createClient({
    awsId: secrets.amazon.awsId,
    awsSecret: secrets.amazon.awsSecret
});

exports.itemLookup = function(id, callback) {
    console.log('Calling amazon itemLookup with asins:' + id);
    client.itemLookup({
        idType: 'ASIN',
        itemId: id,
        responseGroup: 'ItemAttributes,Offers,Images,EditorialReview,BrowseNodes'
    }, function(err, response) {
        callback(response);
    })
};



