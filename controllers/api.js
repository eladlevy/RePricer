var secrets = require('../config/secrets');
var User = require('../models/User');
var Listing = require('../models/Listing');
var querystring = require('querystring');

exports.getListings = function(req, res) {
  var userId = req.user.id;
  Listing.find({ 'user_id': userId }).lean().exec(function (err, listings) {
    return res.end(JSON.stringify(listings));
  });
};

