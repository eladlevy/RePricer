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

exports.getSettings = function(req, res, next) {
    res.render('settings', {
        title: 'Settings'
    });
};

exports.postSettings = function(req, res, next) {
    req.assert('marginPercent', 'Margin percent can\'t be empty').notEmpty();
    req.assert('marginMinimum', 'Minimum margin can\'t be empty').notEmpty();
    req.assert('handelingTime', 'Handeling time can\'t be empty').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/settings');
    }

    User.findById(req.user.id, function(err, user) {
        if (err) return next(err);
        user.settings.marginPercent = req.body.marginPercent;
        user.settings.marginMinimum = req.body.marginMinimum;
        user.settings.handelingTime = req.body.handelingTime;
        user.save(function(err) {
            if (err) return next(err);
            req.flash('success', { msg: 'Settings saved!' });
            res.render('settings', {
                title: 'Settings'
            });
        });
    });
};