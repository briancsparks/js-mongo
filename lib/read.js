
var sg              = require('sgsg');
var _               = require('underscore');
var MongoClient     = require('mongodb').MongoClient;
var helpers         = require('./helpers');

var getColl         = helpers.collection;
var getDbUrl        = helpers.getDbUrl;

var die             = sg.die;

var libDb       = {};

libDb.eachDoc = function(cursor, callback_, finalCb_) {   /* or dbUrl, collectionName, [query, options,] callback, finalCb */
  if (arguments.length === 3)   { return libDb.eachDoc(cursor, callback_, finalCb_); }

  /* otherwise -- make a cursor */
  var args      = _.toArray(arguments);
  var finalCb   = args.pop();
  var callback  = args.pop();
  var dbUrl     = args.shift();
  var collName  = args.shift();
  var query     = args.shift()    || {};
  var options   = args.shift()    || {};

  return libDb.cursor(dbUrl, collName, query, options, function(err, cursor) {
    if (err)      { return die(err, finalCb, 'jsMongo.eachDoc.cursor'); }

    return eachOne(cursor, callback, finalCb);
  });

  function eachOne(cursor, callback, finalCb) {
    var count = 0;
    return one();

    function one() {
      cursor.next(function(err, doc) {
        if (err)    { return finalCb(err); }
        if (!doc)   { return finalCb(null, count); }

        count += 1;
        var nextDoc = function() {
          if (count % 4)  { return setImmediate(one); }
          return one();
        };

        return callback(doc, nextDoc, count - 1);
      });
    }
  }
};

libDb.cursor = function(dbUrl, collection, query, options, callback) {
  return getColl(dbUrl, collection, function(err, collection) {
    var cursor = collection.find(query);

    return callback(null, cursor);
  });
};

libDb.toArray = function() {
  var args      = _.toArray(arguments);
//  var finalCb   = args.pop();
  var callback  = args.pop();

  var result = [];
  args.push(function(doc, nextDoc) {
    result.push(doc);
    return nextDoc();
  });

  args.push(function() {
    return callback(null, result);
  });

  return libDb.eachDoc.apply(libDb, args);
};

_.each(libDb, function(value, key) {
  exports[key] = value;
});

