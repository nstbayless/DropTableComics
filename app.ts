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
var RouteAuthentication = require('./routes/authentication');
var RouteComic = require('./routes/comic');
var RouteAdminPage = require('./routes/adminpage');

import DatabaseManager = require("./src/DatabaseManager");
import { NotificationManager } from './src/NotificationManager';
var db;
var dbManager: DatabaseManager;
var nManager: NotificationManager;

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
	constructor(altdb: any) {
		db = altdb;
		if (!db) {
			db = monk(config.db);
		}
		dbManager = new DatabaseManager(db);
		nManager = new NotificationManager(dbManager);
		var routeComic = new RouteComic();
		var routeAuthentication = new RouteAuthentication();
		var routeAdminPage = new RouteAdminPage();

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
			req.nManager = nManager;
			req.db=db;
			next();
		});

		//public routes
		app.use('/', routeAuthentication.getRouter())

		//registration-protected routes
		app.use('/', routeComic.getRouter());
		app.use('/', routeAdminPage.getRouter());

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
