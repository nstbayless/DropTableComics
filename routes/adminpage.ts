///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 

//displays page for viewing admin persmissions

var express = require('express');

class RouteAdminPage {
	router_: any;
	constructor() {
		var router = express.Router();
		/* GET Admin Page */
		router.get('/', function(req, res, next) {
			
			// GET the list of viewable comics from user
			var user = req.user;
			var comics = req.db.get('comics');
			//var viewlist = user.getViewlist(); 
			comics.find({ comic: name }, {}, function(e, docs) {
				res.render('/*', {
					title: 'admin page',
					stuff: docs.getViewlist
				});
			});
		});
		this.router_ = router;
	}
	getRouter() {
		return this.router_;
	}
}
 module.exports=RouteAdminPage