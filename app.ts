///<reference path='types/node/node.d.ts'/>
///<reference path='types/express/express.d.ts'/> 

var config = require('./config')
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var passportjwt = require('passport-jwt');
var jwt = require('jwt-simple');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk(config.db);
var RouteIndex = require('./routes/index');
var RoutePretty = require('./routes/pretty');
var RouteAuthentication = require('./routes/authentication');
var AuthID = require('./mongoose/authschema');

interface Error {
  status?: number;
}

class Application {
//app stored as public member (type not known)
  app_: any;
constructor() {
  var routeIndex = new RouteIndex();
  var routePretty = new RoutePretty();
  var routeAuthentication = new RouteAuthentication();

  var app = express();
  
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  //make html output prettier:
  app.locals.pretty = true;
  
  //middleware
  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(function(req,res,next){
      req.db = db;
      next();
  });
  
  //public routes
  app.use('/', routeAuthentication.getRouter())
  
  //registration-protected routes
  app.use('/', routeIndex.getRouter());
  app.use('/pretty', routePretty.getRouter());

  //configure passport
  passport.use(new passportjwt.Strategy({
      secretOrKey: config.secret
    },
    function(payload, done) {
      var id = payload.id;
      //database read via mongoose
      AuthID.findOne({id: id}, function(err, user_id){
        //user verification
        if (err)
          return done(err);
        if (user_id) {
          var user//: User;
          //get user class
          return done(null,false,
            {message: 'userid lookup not yet implemented!'});
        }
        else
          return done(null,false, {message: 'user id not found'});
      })
    }
  ))
  
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

module.exports=Application
