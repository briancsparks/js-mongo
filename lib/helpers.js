
/**
 *
 */

var sg              = require('sgsg');
var _               = sg._;
var MongoClient     = require('mongodb').MongoClient;

var die             = sg.die;

var dbs             = {};

var libHelpers      = {};

//=====================================================================================================
//
//  DB operations
//
//=====================================================================================================

libHelpers.db = function(url, callback) {

  return sg.__run([function(next) {
    if (dbs[url])   { return next(); }

    return MongoClient.connect(url, function(err, db) {
      if (err)      { return die(err, callback, 'js-mongo.db.connect'); }

      dbs[url] = db;
      return next();
    });
  }], function() {
    return callback(null, dbs[url]);
  });
};

libHelpers.collection = function(url, collectionName, callback) {
  return libHelpers.db(url, function(err, db) {
    if (err)      { return die(err, callback, 'js-mongo.collection.db'); }

    return callback(null, db.collection(collectionName));
  });
};

//=====================================================================================================
//
//  General helpers
//
//=====================================================================================================

libHelpers.getDbUrl = function(name, default_, env_) {
  return 'mongodb://'+getDbHost(default_, env_)+':27017/'+name;
};

var getDbHost = libHelpers.getDbHost = function(default_, env_) {
  var r, ns;

  if ((r = _getEnv('JS_MONGO_DB_HOST', env_)))           { return r; }

  if ((ns = _getEnv('NAMESPACE', env_))) {
    ns = ns.toUpperCase();

    if ((r = _getEnv(ns+"_DB_HOST", env_)))              { return r; }
    if ((r = _getEnv(ns+"_DB_HOSTNAME", env_)))          { return r; }
    if ((r = _getEnv(ns+"_DB_IP", env_)))                { return r; }
  }

  return default_ || '127.0.0.1';
};

var _getEnv = libHelpers._getEnv = function(key, env_) {
  var env = env_ || process.env;
  return env[key];
};

_.each(libHelpers, function(value, key) {
  exports[key] = value;
});

