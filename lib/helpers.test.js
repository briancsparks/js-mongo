
/**
 *
 */

/* jshint node:true, esversion:6 */

import test from 'ava';

var helpers             = require('./helpers');

var env1 = { JS_MONGO_DB_HOST : '1.2.3.1' };
var env2 = { NAMESPACE : 'foobar', FOOBAR_DB_IP  : '1.2.3.2' };
var env3 = { NAMESPACE : 'foobar', FOOBAR_DB_HOST  : '1.2.3.3' };
var env4 = { NAMESPACE : 'foobar', FOOBAR_DB_HOSTNAME  : '1.2.3.4' };

test(function(t) {
  t.pass('ava is working');
});

test('helpers can get db name', function(t) {
  t.is(helpers._getEnv('NAMESPACE', env2), 'foobar');

  t.is(helpers.getDbHost(null, env1), '1.2.3.1', 'Get via JS_MONGO_DB_HOST');
  t.is(helpers.getDbHost(null, env2), '1.2.3.2', 'Get via NAMESPACE_DB_IP');
  t.is(helpers.getDbHost(null, env3), '1.2.3.3', 'Get via NAMESPACE_DB_HOST');
  t.is(helpers.getDbHost(null, env4), '1.2.3.4', 'Get via NAMESPACE_DB_HOSTNAME');
});

test('helpers can get db url', function(t) {
  t.is(helpers.getDbUrl('bar', null, env4), 'mongodb://1.2.3.4:27017/bar', 'Get URL via NAMESPACE_DB_HOSTNAME');
});

