///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 

//displays page for viewing admin persmissions

var express = require('express');

import {User } from'../src/User' ;
import {Artist } from'../src/User' ;
import { Comic } from '../src/Comic';
import { Page, Panel } from '../src/Page';
var multer  = require('multer');
var upload = multer({ dest: './data/images/' });
var fs = require('fs');

var express = require('express');
var config = require('../config');
var fs = require('fs');

//TODO: these functions should go into RoutePretty as static methods

// Parses comic uri from full uri
function parseComicURI(url: string):string {
	var res = url.split("/");
	var id=res.indexOf("comics");
	if (!id)
		return null;
	if (res.length<=id)
		return null;
	var comic_uri = res[id+1];
	return Comic.canonicalURI(comic_uri);
}

// Parses author name from uri
function parseComicCreator(url: string):string {
	var res = url.split("/");
	var id=res.indexOf("comics");
	if (!id)
		return null;
	if (id==0)
		return null;
	var author = res[id-1];
  //  TODO: Add dash/space checking parseComicCreator
	return author;
}

// Parses comic panel # from uri
function parsePanelID(url: string):string {
	var res = url.split("/");
	var id=res.indexOf("panels");
	if (!id)
		return null;
	if (res.length<=id)
		return null;
	var panel = res[id+1];
  //  TODO: Add dash/space checking parseComicCreator
	return panel;
}

class RouteAdminPage {
	router_: any;
	constructor() {
		var router = express.Router();
		/* GET pretty adminpage */
		router.get(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/admin$/, function(req, res, next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri || !comic_creator)
				return next();		
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				//TODO: make this getCanAdmin
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				//TODO: rename 'newcomic' to 'viewcomic' or something
				return res.render('adminpage', {
					title: comic.getName(),
					viewlist: comic.getViewlist(),
					editlist: comic.getEditlist(),
					comic_creator: comic_creator,
					comic_name: comic.getName(),
					comic_uri: comic_uri,
				})
			})
		});

		//TODO(Edward): we should have a different URI for each permission list
		/* POST a user to Comic Viewlist. */
		router.post(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/admin$/, function(req, res, next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);

			if (!comic_creator || !comic_uri == null)
				return next();
			if (!req.body.username) {   //incorrect POST body
				return next();
			}
			req.dbManager.getComic(comic_creator,comic_uri,function (err,comic) {
				//check request user has permission to edit comic:
				if (err) //send 401 not 404 to prevent information leak:
					return res.status(401).send(); //TODO(NaOH): add error message and combine with next check
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return res.status(401).send();
				req.dbManager.getUser(req.body.username, function(err, user) {
					if (!user || err) { // checks to see if the username inputted is currently a valid user
						console.log("User does not exist!");
						return res.status(404).send({
							success: false,
							msg: 'No username found, please input a valid username'
						})
					}
					else { // should run if there is a valid user with the inputted username
						req.dbManager.postViewlist(comic_creator, comic_uri, req.body.username, function(err, viewlist) {
							if (viewlist != null && !err) {
								console.log("IT WORKED, YOU ADDED IT!");
								res.status(200).send({ success: true });
							} else {
								res.status('500').send({ success: false, msg: "Error inserting user to viewlist" });
							}
						})
					}
				})
			});
		})

		/* POST a user to Comic Editlist. */
		router.post(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/admin$/, function(req, res, next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);

			if (!comic_creator || !comic_uri == null)
				return next();
			if (!req.body.editor) {   //incorrect POST body
				return res.status(400).send({ success: false, msg: 'Please provide a username' });
			}
			req.dbManager.getComic(comic_creator,comic_uri,function(err,comic) {
				//check request user has permission to edit comic:
				if (err) //send 401 not 404 to prevent information leak:
					return res.status(401).send(); //TODO(NaOH): add error message and combine with next check
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return res.status(401).send();
				req.dbManager.getUser(req.body.editor, function(err, user) {
					if (!user || err) { // checks to see if the username inputted is currently a valid user
						res.status(400).send({ success: false, msg: 'No username found, please input a valid username' })
						//TODO: error message if user already on edit list
					} else if (user.getType() != "artist") {
						res.status(406).send({ success: false, msg: 'User is not an artist' });
					}
					else { // should run if there is a valid user with the inputted username
						req.dbManager.postEditlist(comic_creator, comic_uri, req.body.editor, function(err, editlist) {
							if (editlist != null && !err) {
								res.status(200).send({ success: true });
							} else {
								res.status('500').send({ success: false, msg: "Error inserting user to viewlist" });
							}
						})
					}
				})
			})
		})

		/* EDIT permission lists */
		//TODO(Edward): check URI for which list to delete from, don't check body (more RESTful)
		router.put(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/admin$/, function(req, res, next) {	
			//weird thing -- this takes a list of elements to delete, it should take a list of elements to not delete.		
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			//list of users to delete:
			var l_users: string[] = req.body.l_users
			//relevant list to delete them from. Can be one of 'view' 'edit' or 'admin'
			var relevant_list = req.body.relevant_list
			if (!comic_creator || !comic_uri == null)
				return next();
			if (!l_users||!l_users.length) {   //incorrect POST body
				return res.status(400).send({ success: false, msg: 'Please provide a list of usernames!' });
			}
			//make sure user doesn't remove self:
			if (l_users.indexOf(req.user.getUsername())>=0)
				return res.status(403).send({success: false, msg: "You cannot remove yourself from the list"})
			if (!(relevant_list=='admin'||relevant_list=='view'||relevant_list=='edit'))
				return res.status(400).send({ success: false, msg: 'Unknown list ' + relevant_list })
			if (l_users.indexOf(comic_creator)>=0)
				return res.status(403).send({success: false, msg: "You cannot remove the comic creator"})
			req.dbManager.getComic(comic_creator,comic_uri, function(err,comic) {
				if (err||!comic)
					return next();
				//TODO: change to getUserCanAdmin
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				//TODO: migrate all following deletion code to a dbManager method:
				var new_list;
				if (relevant_list=='view')
					new_list=comic.getViewlist();
				if (relevant_list=='edit')
					new_list=comic.getEditlist();
				//TODO: implement adminList
				new_list=new_list.slice();//prevent editing original object
				//remove all users from relevant list:
				for (var i=0;i<l_users.length;i++) {
					var index_in_list = new_list.indexOf(l_users[i])
					if (index_in_list==-1)
						return res.status(400).send({success: false, msg: "User not previously in list: " + l_users[i]})
					else {
						new_list.splice(index_in_list,1);
					}
					console.log(new_list);
				}
				//update comic's list:
				var comics = req.db.get('comics');
				var set_db;
				if (relevant_list=="view")
					set_db={
						"viewlist":new_list
					}
				if (relevant_list=="edit")
					set_db={
						"editlist":new_list
					}
				if (relevant_list=="admin")
					set_db={
						"adminlist":new_list
					}
				req.db.get('comics').update({
					"urisan": Comic.canonicalURI(comic_uri),
					"creator": comic_creator
				},{
					$set: set_db
				})
				return res.status(200).send({success: true, msg: "Users removed from list."})
			})
		})
		this.router_ = router;
	}
	getRouter() {
		return this.router_;
	}
}
 module.exports=RouteAdminPage
