///<reference path='types/node/node.d.ts'/>
///<reference path='types/express/express.d.ts'/> 

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27018/cpsc310');

interface Error {
  status?: number;
}

class Application {
//app stored as public member (type not known)
  app_: any;
constructor() {
  var route_index = require('./routes/index');
  var route_pretty = require('./routes/pretty');

  var app = express();
  
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  //make html output prettier:
  app.locals.pretty = true;
  
  // uncomment after placing your favicon in /public
  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(function(req,res,next){
      req.db = db;
      next();
  });
  
  app.use('/', route_index);
  app.use('/pretty', route_pretty);
  //app.use('/users', users);
  
  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });
  
  // error handlers
  
  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }
  
  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
  this.app_=app
  //console.log("serving at "+app.address())
}
//called after www start script
onStart(port) {
  console.log("serving on port " + port)
}
getApp(){
  return this.app_;
}
}


var application = new Application();

module.exports=application
