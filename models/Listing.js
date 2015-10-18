var mongoose = require('mongoose');

var listingSchema = new mongoose.Schema({
  asin: {type: String, uppercase: true},
  itemId: String,
  user_id: String,
  status: String,
  ebayErrors: Array,
  lastRevisionAction: { type: String, default: '' },

  data: {
    Title: { type: String, default: '' },
    Description: { type: String, default: '' },
    StartPrice: { type: String, default: '' },
    PictureDetails: {
      PictureURL: [{type: String, default: ''}]
    },
    ItemSpecifics: {
      NameValueList: { type : Array , "default" : [] }
    },
    Quantity:{ type: String, default: '0' },
    PrimaryCategory: {CategoryID: String},
    PayPalEmailAddress: { type: String, default: '' }
  }
});

listingSchema.index({ asin: 1, user_id: 1}, { unique: true });

module.exports = mongoose.model('Listing', listingSchema);