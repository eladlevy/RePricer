var mongoose = require('mongoose');

var runSchema = new mongoose.Schema({
  created: { type : Date, default: Date.now },
  userId: String,
  status: String,
  revisions: Array,
  //outOfStock: Array,
  ebayErrors: Array,
  listings: Number
});

module.exports = mongoose.model('Run', runSchema);
