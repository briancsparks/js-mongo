
/**
 *
 */

/* jshint node:true, esversion:6 */

import test from 'ava';
var sg                    = require('sgsg');
var _                     = sg._;
var mongoWriter           = require('./write');
var mongoReader           = require('./read');
var helpers               = require('./helpers');

var getColl               = helpers.collection;
var getDbUrl              = helpers.getDbUrl;

var dbUrl                 = getDbUrl('jsmongo_unit_tests') ;

test(function(t) {
  t.pass('ava is working');
});

test.cb('js-mongo cruds', function(t) {
  t.plan(5);

  var insert = new mongoWriter.MongoInsert('key', 'foo');
  return getColl(dbUrl, 'inserts', function(err, collection) {
    t.falsy(err);

    return insert.commit({}, collection, function(err, receipt) {
      t.falsy(err);

      return mongoReader.eachDoc(dbUrl, 'inserts', {key:'foo'}, function(doc, nextDoc) {
        t.deepEqual(_.omit(doc, '_id'), {key:'foo'});

        return nextDoc();
      }, function(err) {
        t.falsy(err);

        return mongoWriter.deleteOne(dbUrl, 'inserts', {key:'foo'}, function(err, receipt) {
          t.falsy(err);
          t.end();
        });
      });
    });
  });
});

test.cb('js-mongo upserts', function(t) {
  t.plan(5);

  var upsert = new mongoWriter.MongoUpsert();

  upsert.set('attr', 32);
  upsert.inc('zero');
  upsert.inc('one', 1);
  upsert.inc('two', 2);

  return getColl(dbUrl, 'upserts', function(err, collection) {
    t.falsy(err);

    return upsert.commit({key:42}, collection, function(err, receipt) {
      t.falsy(err);

      return mongoReader.eachDoc(dbUrl, 'upserts', {key:42}, function(doc, nextDoc) {
        t.deepEqual(_.omit(doc, '_id', 'ctime', 'mtime'), {key:42, attr:32, zero:1, one:1, two:2});

        return nextDoc();
      }, function(err) {
        t.falsy(err);

        return mongoWriter.deleteOne(dbUrl, 'upserts', {}, function(err, receipt) {
          t.falsy(err);
          t.end();
        });
      });
    });
  });
});

test.cb(function(t) {
  t.plan(5);

  var upsert = new mongoWriter.MongoUpsert();

  upsert.addToSet('attr', 32);

  return getColl(dbUrl, 'upserts', function(err, collection) {
    t.falsy(err);

    return upsert.commit({key:43}, collection, function(err, receipt) {
      t.falsy(err);

      return mongoReader.eachDoc(dbUrl, 'upserts', {key:43}, function(doc, nextDoc) {
        t.deepEqual(_.omit(doc, '_id', 'ctime', 'mtime'), {key:43, attr:[32]});

        return nextDoc();
      }, function(err) {
        t.falsy(err);

        return mongoWriter.deleteOne(dbUrl, 'upserts', {}, function(err, receipt) {
          t.falsy(err);
          t.end();
        });
      });
    });
  });
});


