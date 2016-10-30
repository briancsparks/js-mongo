
/**
 *
 */

var sg            = require('sgsg');
var _             = sg._;
var helpers       = require('./helpers');

var getColl       = helpers.collection;

var dbIp          = process.env.MARIO_RT_DB_IP;
var coll          = 'rtstats';
var dbUrl         = 'mongodb://'+dbIp+':27017/clusterStats';

var libStats = {};

libStats.watchit = function(namespace, slug, log, tagsValues, callback_) {
  var callback = callback_ || function(){};

  return getColl(dbUrl, coll, function(err, rtstats) {
    if (err)      { return callback(err); }

    var ops = [];

    if (log) {
      ops.push({insertOne: {document: {log:log}}});
    }

    _.each(tagsValues, function(value, tag) {
      ops.push({updateOne: {filter: {ns: namespace, tag:tag, v:value, slug:slug}, update:{$inc:{count:1}}, upsert:true}});
    });

    rtstats.bulkWrite(ops, {ordered:false}, function(err, r) {
      return callback.apply(this, arguments);
    });
  });
};

libStats.watchitEx = function(namespace, slug, log, tagsValues_, callback) {
  var ext         = {
    MARIO_STACK : process.env.MARIO_STACK
  };

  var tagsValues = _.extend({}, ext, tagsValues_);
  return libStats.watchit(namespace, slug, log, tagsValues, callback);
};


_.each(libStats, function(value, key) {
  exports[key] = value;
});

