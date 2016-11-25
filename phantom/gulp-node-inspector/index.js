'use strict';

var es = require('event-stream'),
  gutil = require('gulp-util'),
  merge = require('merge'),
  debugServer = require('node-inspector/lib/debug-server'),
  Config = require('node-inspector/lib/config'),
  packageJson = require('node-inspector/package.json');

var PluginError = gutil.PluginError;
var config = new Config([]);
var DebugServer = debugServer.DebugServer;
var log = gutil.log,
  colors = gutil.colors;

var PLUGIN_NAME = 'gulp-node-inspector';

var nodeInspector = function(opt) {

  var stream;

  var startDebugServer = function() {
    var options = merge(config, opt);

    log(PLUGIN_NAME, 'is using node-inspector v' + packageJson.version);

    var debugServer = new DebugServer(options);

    debugServer.on('error', function(err) {

      if (err.code === 'EADDRINUSE') {
        log(colors.red('There is another process already listening at this address.\nChange "webPort": {port} to use a different port.'));
      }

      stream.emit('error', PluginError(PLUGIN_NAME, 'Cannot start the server at ' + config.webHost + ':' + config.webPort + '. Error: ' + (err.message || err)));
    });

    debugServer.on('listening', function() {
      log(colors.green('Visit', this.address().url, 'to start debugging.'));
    });

    debugServer.on('close', function() {
      done();
    });

    debugServer.start(config);
  }

  function done() {
    // End the stream if it exists
    if (stream) {
      stream.emit('end');
    }
  }

  var queueFile = function(file) {};

  var endStream = function() {
    startDebugServer();
  };

  // copied from gulp-karma
  stream = es.through(queueFile, endStream);

  return stream;
};

module.exports = nodeInspector;
