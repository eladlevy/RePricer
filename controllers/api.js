var secrets = require('../config/secrets');
var User = require('../models/User');
var Listing = require('../models/Listing');
var Run = require('../models/Run');
var querystring = require('querystring');

exports.getListings = function(req, res) {
  var userId = req.user.id;
  Listing.find({$and: [{ 'user_id': userId }, {status: {$not: { $eq: 'INVALID_ASIN' }}}]}).lean().exec(function (err, listings) {
    return res.end(JSON.stringify(listings));
  });
};

exports.getMonitorRuns = function(req, res) {
  var userId = req.user.id;
  Run.find({ 'userId': userId }).limit(25).lean().exec(function (err, runs) {
    return res.end(JSON.stringify(runs));
  });
};

exports.getRunRevisions = function(req, res, next) {
  var runId = req.params.runId;
  Run.findById(runId).lean().exec(function (err, run) {
    if(err) return next(err);
    var revisions = run.revisions;
    return res.end(JSON.stringify(revisions));
  });
};

exports.getDefaultRevisions = function(req, res, next) {
  Run.findOne({userId: req.user.id}, {}, { sort: { 'created' : -1 } }).lean().exec(function (err, run) {
    if(err) return next(err);
    var revisions = run.revisions;
    return res.end(JSON.stringify(revisions));
  });
};