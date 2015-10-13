var CronJob = require('cron').CronJob;
var Listing = require('../models/Listing');
var User = require('../models/User');
var amazonProvider = require('../lib/amazonApiProvider');
var ebayProvider = require('../lib/ebayApiProvider');

var scanListings = function() {
    User.find({}, function (err, users) {
        if (err) {
            console.error('Error reading from User table');
            return;
        }

    });
};
var job = new CronJob({
    cronTime: '0 */2 * * * ',
    onTick: scanListings,
    start: false,
    timeZone: 'America/Los_Angeles'
});
job.start();