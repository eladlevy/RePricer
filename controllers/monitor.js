var User = require('../models/User');
var Listing = require('../models/Listing');
var Run = require('../models/Run');
var async = require('async');
var _ = require('underscore');

exports.getMonitor = function(req, res) {
    res.render('monitor', {
        title: 'Monitor'
    });
};

exports.getMonitorRuns = function(req, res, next) {
    res.render('monitor', {
        title: 'Monitor'
    });
};

exports.getRevisions = function(req, res, next) {
    res.render('revisions', {
        title: 'Revisions'
    });
};
