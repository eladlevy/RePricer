var generateQueryString = require('./utils').generateQueryString,
    request = require('request'),
    xml2js = require('xml2js'),
    Promise = require('es6-promise').Promise;

var parser = xml2js.Parser({
  attrkey: '@',
  charkey: '#text',
  explicitArray: false
});

var runQuery = function (credentials, method) {

  return function (query, cb) {
    var url = generateQueryString(query, method, credentials),
        results;

    if (typeof cb === 'function') {
      request(url, function (err, response, body) {

        if (err) {
          cb(err);
        } else if (!response) {
          cb("No response (check internet connection)");
        } else if (response.statusCode !== 200) {
          parser.parseString(body, function (err, resp) {
            if (err) {
              cb(err);
            }
            cb(resp[method + 'ErrorResponse']);
          });
        } else {
          parser.parseString(body, function (err, resp) {
            var results = null;
            var responseObject = resp[method + 'Response'];
            //if (method === 'BrowseNodeLookup' && resp[method + 'Response'].BrowseNodes && resp[method + 'Response'].BrowseNodes.length > 0) {
            //  results = resp[method + 'Response'].BrowseNodes[0].BrowseNode;
            //} else {
            //  results = resp[method + 'Response'].Items[0].Item;
            //}
            cb(null, responseObject);
          });
        }
      });

    }

    var promise = new Promise(function (resolve, reject) {

      request(url, function (err, response, body) {

        if (err) {
          reject(err);
        } else if (!response) {
          reject("No response (check internet connection)");
        } else if (response.statusCode !== 200) {
          parser.parseString(body, function (err, resp) {
            if (err) {
              reject(err);
            }
            reject(resp[method + 'ErrorResponse']);
          });
        } else {
          parser.parseString(body, function (err, resp) {
            var results = null;
            var responseObject = resp[method + 'Response'];
            resolve(responseObject);
          });
        }
      });
    });

    return promise;
  };
};

var createClient = function (credentials) {
  return {
    itemSearch: runQuery(credentials, 'ItemSearch'),
    itemLookup: runQuery(credentials, 'ItemLookup'),
    browseNodeLookup: runQuery(credentials, 'BrowseNodeLookup')
  };
};

exports.createClient = createClient;