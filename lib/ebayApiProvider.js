var secrets = require('../config/secrets');
var User = require('../models/User');
var request = require('request');
var xml2js = require('xml2js');
var _ = require('underscore');
var async = require('async');
var utils = require('../lib/utils');
var parser = xml2js.Parser({
    attrkey: '@',
    charkey: '#text',
    explicitArray: false
});

var buildXmlData = function(callName, jsonObj) {
    var builder = new xml2js.Builder({ headless : true });
    var xmlStr = builder.buildObject(jsonObj);

    xmlStr = xmlStr.replace('<root>', '');
    xmlStr = xmlStr.replace('</root>', '');

    var xmlData = '<?xml version="1.0" encoding="utf-8"?>'
        + '<' + callName + 'Request xmlns="urn:ebay:apis:eBLBaseComponents">'
        + xmlStr
        + ' </' + callName + 'Request>';

    return xmlData;
};

var handleResponse = function(err, response, body, callName,callback) {
    if (err) {
        var error = err;
        error.message = "Completed with error: " + error.message;
        return callback(error);
    }
    else if (response.statusCode !== 200) {
        return callback(new Error(util.format("Bad response status code", response.statusCode, result.toString())));
    }

    parser.parseString(body, function (err, resp) {
        if (err) {
            return callback(error)
        }
        var responseObject = resp[callName + 'Response'];
        callback(err, responseObject);
    });
};
var makeRequest = function(callName, jsonObj, callback) {
    var defaultHeaders = {
        'X-EBAY-API-APP-NAME': secrets.ebay.appId,
        'X-EBAY-API-DEV-NAME': secrets.ebay.devId,
        'X-EBAY-API-CERT-NAME': secrets.ebay.certId,
        'X-EBAY-API-COMPATIBILITY-LEVEL': 939,
        'X-EBAY-API-CALL-NAME': callName,
        'X-EBAY-API-SITEID': 0,
        'Content-Type' : 'text/xml'
    };

    var data = buildXmlData(callName, jsonObj);

    request.post({
        url: secrets.ebay.host + '/ws/api.dll',
        headers: defaultHeaders,
        body: data
    },function(err, response, body) {
        handleResponse(err, response, body, callName, callback);
    });
};

exports.getSessionId = function(callback) {
    makeRequest('GetSessionID', { RuName: secrets.ebay.ruName}, callback)
};

exports.getToken = function(sessionId, callback) {
    makeRequest('FetchToken', {SessionID: sessionId}, callback)
};

exports.getUser = function(token, callback) {
    makeRequest('GetUser', {
        RequesterCredentials: {
            eBayAuthToken: token
        }
    }, callback)
};

exports.findCategory = function(token, query, callback) {
    makeRequest('GetSuggestedCategories', {
        RequesterCredentials: {
            eBayAuthToken: token
        },
        ErrorLanguage: 'end_US',
        WarningLevel: 'High',
        Query: query
    }, callback);
};

exports.addItems = function(token, listings, callback) {
    var items = [];
    var itemDefaults = {
        "Title": "A book Potter and the Philosopher's Stone",
        "Description": "This is the first book in the Harry Potter series. In excellent condition!",
        "PrimaryCategory": {"CategoryID": "377"},
        "StartPrice": "300.0",
        //"BuyItNowPrice": '18.0',
        "CategoryMappingAllowed": "true",
        "ConditionID": "1000",
        "Country": "US",
        "Currency": "USD",
        "DispatchTimeMax": "3",
        "ListingDuration": "GTC",
        "ListingType": "FixedPriceItem",
        "PaymentMethods": "PayPal",
        "PayPalEmailAddress": "magicalbookseller@yahoo.com",
        "PictureDetails": {"PictureURL": "http://pics.ebay.com/aw/pics/dot_clear.gif"},
        "PostalCode": "95125",
        "Quantity": "1",
        "ReturnPolicy": {
            "ReturnsAcceptedOption": "ReturnsAccepted",
            "RefundOption": "MoneyBack",
            "ReturnsWithinOption": "Days_14",
            "Description": "The buyer has 14 days to return the item (the buyer pays shipping fees). " +
            "The item will be refunded. Returns are not accepted if the box was opened or if the product was used!",
            "ShippingCostPaidByOption": "Buyer"
        },
        "ShippingDetails": {
            "ShippingType": "Flat",
            "ShippingServiceOptions": {
                "ShippingServicePriority": "1",
                "ShippingService": "USPSStandardPost",
                "ShippingServiceCost": "0"
            }
        },
        "Site": "US"
    };

    _.each(listings, function(listing) {
        items.push({
            MessageID: listing.id,
            Item: _.defaults(listing.toObject().data || {}, itemDefaults)
        });
    });

    makeRequest('AddItems', {
        RequesterCredentials: {
            eBayAuthToken: token
        },
        AddItemRequestContainer: items,
        ErrorLanguage: 'end_US',
        WarningLevel: 'High'
    }, callback)
};

var reviseInventoryStatus = function(token, listings, callback) {
    var itemsArray = [];
    _.each(listings, function(listing) {
        var listing = {
            ItemID: listing.itemId,
            StartPrice: listing.price,
            Quantity: listing.quantity
        };

        itemsArray.push(_.pick(listing, _.identity));
    });
    makeRequest('ReviseInventoryStatus', {
        RequesterCredentials: {
            eBayAuthToken: token
        },
        InventoryStatus: itemsArray,
        ErrorLanguage: 'end_US',
        WarningLevel: 'High'
    }, callback)
};

exports.reviseMultipleInventoryStatus = function(token, listings, callback) {
    var MAX_PER_EBAY_REVISE_CALL = 4;
    var callArray = [];
    var chunkedListings = utils.chunk(listings, MAX_PER_EBAY_REVISE_CALL);
    _.each(chunkedListings, function(batch) {
        callArray.push(function(asyncCallback) {
            reviseInventoryStatus(token, batch, function(err, data) {
                asyncCallback(null, data);
            });
        });
    });
    async.parallel(callArray, function(err, result) {
        if (err) {
            console.log('Error revising in Ebay');
            return;
        }
        var revisionErrors = [];
        _.each(result, function(responseBatch) {
            var ebayErrors = utils.ensureArray(responseBatch && responseBatch.Errors);
            revisionErrors = revisionErrors.concat(ebayErrors)
        });
        revisionErrors = _.where(revisionErrors, {SeverityCode: 'Error'});
        callback(revisionErrors);
    });
};
exports.makeRequest;
