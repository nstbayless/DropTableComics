///<reference path='types/node/node.d.ts'/>
///<reference path='types/express/express.d.ts'/> 

var config = require('./config')
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk(config.db);
var RouteIndex = require('./routes/index');
var RoutePretty = require('./routes/pretty');
var RouteAuthentication = require('./routes/authentication');

import DatabaseManager = require("./src/DatabaseManager")

var dbManager: DatabaseManager = new DatabaseManager(db);

//fatal error if cannot connect to database:
try {
	http.get("http://"+config.db);
  console.log("Connected to MongoDB.")
} catch (err) {
	console.log("Could not connect to MongoDB!");
	console.log(err);
}

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
		app.use(express.static(path.join(__dirname, 'public')));
		app.use(function(req,res,next){
			req.dbManager = dbManager;
			req.db=db;
			next();
		});

		//public routes
		app.use('/', routeAuthentication.getRouter())

		//registration-protected routes
		app.use('/', routeIndex.getRouter());
		app.use('/pretty', routePretty.getRouter());

		// catch 404 and forward to error handler
		app.use(function(req, res, next) {
			var err: Error = new Error('Not Found');
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
		var httptype = "http";
		if (config.https)
		httptype = "https";
		console.log("serving " + httptype + " on port " + port)
	}
	getApp(){
		return this.app_;
	}
}

module.exports=Application
