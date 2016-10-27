
/**
 *
 */

var sg                    = require('sgsg');
var _                     = require('underscore');
var helpers               = require('./helpers');
var MongoClient           = require('mongodb').MongoClient;

var die                   = sg.die;
var isnt                  = sg.isnt;
var getColl               = helpers.collection;
var getDbHost             = helpers.getDbHost;

var libDb                 = {};

/**
 *  Insert an item.
 */
libDb.MongoInsert = function(id, value) {
  var self    = this;

  self.commit = function() {
    return commitArgs(arguments, function(obj_, collection, callback) {
      var obj = _.extend(sg.kv(id, value), obj_);

      return collection.insertOne(obj, function(err, receipt) {
        return callback(err, receipt);
      });
    });
  };
};

/**
 *  Upsert a document
 */
libDb.MongoUpsert = function() {
  var self    = this;

  libDb.MongoUpdater.apply(this, arguments);

  self.commit = function() {
    return commitArgs(arguments, function(obj, collection, callback) {
      return collection.updateOne(obj, self.ops(), {upsert:true}, function(err, receipt) {
        if (err) { return callback(err); }

        return callback(null, receipt);
      });
    });
  };
};

/**
 *  Find one doc, update/upsert it, and return the new version.
 */
libDb.FindOneAndUpdate = function() {
  var self    = this;

  libDb.MongoUpdater.apply(this, arguments);

  self.commit = function() {
    return commitArgs(arguments, function(obj, collection, callback) {
      return collection.findOneAndUpdate(obj, self.ops(), {returnOriginal:false, upsert:true}, function(err, r) {
        if (err) { return callback(err); }

        return callback(null, r.value.b);
      });
    });
  };
};

/**
 *  Helper class to implement things like $set.
 */
libDb.MongoUpdater = function() {
  var self      = this;

  self.start    = new Date();
  self.ops_     = {$set:{}, $inc:{}, $addToSet:{}};

  /**
   *  Set a value on a field.
   */
  self.set = function(key, value) {

    if (key && !isnt(value)) {
      self.ops_.$set[key] = value;
    }

    return value;
  };

  /**
   *  Add a value (or values) to an arry field.
   */
  self.addToSet = function(key, values_) {
    var values = _.isArray(values_) ? values_ : [values_];

    if (key && !isnt(values_)) {
      self.ops_.$addToSet[key] = self.ops_.$addToSet[key] || [];
      self.ops_.$addToSet[key] = self.ops_.$addToSet[key].concat(values);
    }

    return values_;
  };

  /**
   *  Increment a field.
   */
  self.inc = function(key, incr_) {
    var incr = incr_ || 1;

    if (!key) { return; }

    self.ops_.$inc[key] = incr;
  };

  self.ops = function() {
    var ops         = _.extend({}, self.ops_);

    ops.$set.mtime  = self.start;

    // Clean up the ops
    ops = sg.reduce(ops, {}, function(m, value, key) {
      if (sg.numKeys(value) === 0)  { return m; }
      return sg.kv(m, key, value);
    });

    if ('$addToSet' in ops) {
      ops.$addToSet = sg.reduce(ops.$addToSet, {}, function(m, value, key) {
        m[key] = { $each: value };
        return m;
      });
    }

    var result = _.extend({
      $currentDate  : { ctime: true }
    }, ops);

    return result;
  };
};

libDb.deleteOne = function(dbUrl, collName, query, callback) {
  return getColl(dbUrl, collName, function(err, collection) {
    if (err) { return callback(err); }

    return collection.deleteOne(query, function(err, receipt) {
      if (err) { return callback(err); }

      return callback(null, receipt);
    });
  });
};

_.each(libDb, function(value, key) {
  exports[key] = value;
});

function commitArgs(args_, callback) {
  var args  = _.toArray(args_);
  var fn    = _.isFunction(_.last(args)) ? args.pop() : function(){};
  var obj   = {};

  if (args.length === 0) {
    obj = {};
  } else if (args.length === 1) {
    obj = args.shift();
  } else {
    if (_.isString(args[0])) {
      obj = sg.kv(args.shift(), args.shift());
    } else {
      obj = args.shift();
    }
  }

  var result = [obj];

  result = result.concat(args);
  result.push(fn);

  return callback.apply(this, result);
}

