var secrets = require('../config/secrets');
var User = require('../models/User');
var Listing = require('../models/Listing');
var Run = require('../models/Run');
var async = require('async');
var amazonProvider = require('../lib/amazonApiProvider');
var ebayProvider = require('../lib/ebayApiProvider');
var _ = require('underscore');

exports.getMonitor = function(req, res) {
    res.render('monitor', {
        title: 'Monitor'
    });
};

exports.getMonitorRuns = function(req, res, next) {
    var userId = req.user.id;
    res.render('monitor', {
        title: 'Monitor'
    });
};

exports.getRevisions = function(req, res, next) {
    var userId = req.user.id;
    res.render('revisions', {
        title: 'Revisions'
    });
};
