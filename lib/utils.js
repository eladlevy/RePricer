var _ = require('underscore');
exports.ensureArray = function(obj) {
  return _.isUndefined(obj) ? [] : (_.isArray(obj) ? obj : [ obj ]);
};

exports.chunk = function(arr, chunkSize) {
  arr = arr || [];
  var lists = _.chain(arr).groupBy(function(element, index) {
    return Math.floor(index/chunkSize);
  }).toArray().value();
  return lists;
};