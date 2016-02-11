#!/usr/bin/env node

///<reference path='types/node/node.d.ts'/>
///<reference path='types/express/express.d.ts'/> 

/**
 * Module dependencies.
 */
declare var require: any;
declare var process: any;

var config = require('./config')
var Application = require('./app')
var application = new Application()
var app = application.getApp()
var debug = require('debug')
var http = require('http');
var https = require('https');
var fs = require('fs')
var port = config.port;
if (config.https)
  port = config.porthttps;
app.set('port', port);
/**
 * Create HTTP server.
 */
var server;
if (config.https) {
  //create https server
  server = https.createServer({
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
  },app);
  //redirect http traffic to https
  http.createServer(function (req, res) {
    var host_spl = req.headers['host'].split(":");
    var host = host_spl[0]
    if (host_spl.length>1) //if port specified, redirect with port
      host+=":"+port;
    res.writeHead(302, { "Location": "https://" + host + req.url });
    res.end();
  }).listen(config.port);
}
else
  server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

//alert app has started
application.onStart(port);
