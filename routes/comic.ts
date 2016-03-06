///<reference path='../types/node/node.d.ts'/>

///<reference path='../types/express/express.d.ts'/> 

//displays dashboard

var MAX_FILE_SIZE = 2*1000*1000//2 mb
var MAX_IMAGE_WIDTH=1200;
var MAX_IMAGE_HEIGHT=800;

import {User } from'../src/User' ;
import {Artist } from'../src/User' ;
import { Comic } from '../src/Comic';
import { NotificationManager } from '../src/NotificationManager';
import { Notification } from '../src/Notification';
import { EventSignal } from '../src/EventSignal';
import { EventType } from '../src/EventType';
var multer  = require('multer');
var upload = multer({ dest: './data/images/' });
var fs = require('fs');

var express = require('express');
var config = require('../config');
var fs = require('fs');
var sizeOf = require('image-size');
var multer  = require('multer');
var upload = multer({
  dest: './data/images/',
  limits: {
		fileSize: MAX_FILE_SIZE,
		files: 1
	}
});

//struct for a single result in a list of search results
class SearchResult{
	linktext: string;
	description: string;
	href: string;
}

//TODO: these functions should go into RoutePretty as static methods

// Parses comic uri from full uri
function parseComicURI(url: string):string {
	var res = url.split("/");
	var id = res.indexOf("comics");
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

class RouteComic {
	router_: any;
	static searchFor(searchtext: string): SearchResult[] {
		var results: SearchResult[] = []
		for (var i = 0; i < 12; i++) {
			//make random search results
			var result: SearchResult = {
				linktext:"search result " + i,
				description:"description " + i,
				href:"/"
			}
			results.push(result);
		}
		return results;
	}
	constructor() {
		var router = express.Router();
		


		/* GET dashboard page. */
		router.get('/', function(req, res, next) {
			var username = req.user.getUsername();  // username
			
			//TODO: Render list of comics accessible by user
			req.dbManager.getUser(username, function(err,user){
				if (err||!user) return res.status(401).send({success: false, msg: 'User does not exist'});
				var isartist = user.isArtist();
				req.dbManager.getComics(username, function(err, comics) {
					req.nManager.getNotifications(username, function(err, notifications:Notification[]){
						var sorted_notifications: Notification[] = notifications.sort((n1,n2) => {
    							if (n1.timestamp.valueOf() < n2.timestamp.valueOf()) {
        						return 1;
    							}
    							if (n1.timestamp.valueOf() > n2.timestamp.valueOf()) {
        						return -1;
    							}
    							return 0;
						});
							res.render('dashboard', {
							"isartist" : isartist,
							"notifications": sorted_notifications,
							title: 'dashboard',
							comics: comics,		// Render list of comics created by user
							comics_length:comics.length,
							notifications_length:notifications.length	
						}); 
					});
				});
			});
		});

				
		/* GET create comic page. */
		router.get(/^\/accounts\/[a-zA-Z0-9\-]*\/create$/, function(req, res, next) {
			var username = req.user.getUsername();  // artist username
			var isartist = req.user.isArtist(); // true if user is an artist
			if (isartist) {
				res.render('createcomic', {
					title: 'Create Comic'
				});
			}
		});
		
		/* POST Comic */
		router.post(/^\/accounts\/[a-zA-Z0-9\-]*\/comics$/, function(req, res, next) {
			var username:string = req.user.getUsername(); 
			if (!req.body.comic_name) //incorrect POST body
				res.status(401).send({success: false, msg: 'Provide comic name'});
			else if (!req.user.isArtist) //incorrect account type
				res.status(401).send({success: false, msg: 'account_type must be "artist"'});
			else {
				// check if user is signed in
				if (!req.user)
					return res.status(401).send({success: false, msg: 'Please sign in to create a comic'})
				req.dbManager.getComic(req.user.getUsername(),
					Comic.canonicalURI(req.body.comic_name), function(err,comic){
					if (comic) {
						console.log("Comic already exists: " + req.body.comic_name);
						return res.status(409).send({success:false, msg: 'Comic already exists with that name'});
					}
					console.log("Creating comic: "+req.body.comic_name);
					comic = req.dbManager.createComic(req.body.comic_name,username,req.body.description);
					req.nManager.subscribeEvent( // subscribes user to comic updates
						new EventSignal(EventType.Comic_Update, comic.getURI()),
						 username, 
						function(err,event_id) {
							if (err||!event_id)
								return res.status(400).send({success: false});
						}); 
					var url_comic_redirect=(req.user.getUsername()+"/comics/"+comic.getURI());
					res.status(200).send({success: true,comic_url:url_comic_redirect})
				});
			} 
		});
			


		/* GET pretty comic edit page */
		router.get(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/edit$/, function(req, res, next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			console.log(req.user.username);
			if (!comic_uri || !comic_creator)
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				return res.render('editcomic', {
					title: comic.getName(),
					comic_creator: comic_creator,
					comic_name: comic.getName(),
					comic_uri: comic.getURI(),
					//TODO: change to getUserCanAdmin()
					adminable: comic.getUserCanEdit(req.user.getUsername()),
					panels: comic.getPage(1)
				})
			})
		});

		/* GET pretty comic page */
		router.get(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*$/, function(req, res, next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri || !comic_creator)
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanView(req.user.getUsername()))
					return next();
				return res.render('viewcomic', {
					title: comic.getName(),
					description: comic.getDescription(),
					editlist: comic.getEditlist(), 
					comic_creator: comic_creator,
					comic_name: comic.getName(),
					comic_uri: comic.getURI(),
					share_link: req.get('host') + req.url,
					editable: comic.getUserCanEdit(req.user.getUsername()),
					panels: comic.getPage(1)
				})
			});
		});

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
				console.log(req.body.editor);
				console.log("Posting to body is not working, input valid name ARE YOU DOING THIS ONE?");
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
						console.log("!!!!!!!!!!USER DOES NOT EXIST!!!!!!!!!!!");
						res.status(400).send({ success: false, msg: 'No username found, please input a valid username' })
						//TODO: error message if user already on edit list
					} else if (user.getType() != "artist") {
						console.log('USER was not an artist type');
						res.status(406).send({ success: false, msg: 'User is not an artist' });
					}
					else { // should run if there is a valid user with the inputted username
						req.dbManager.postEditlist(comic_creator, comic_uri, req.body.editor, function(err, editlist) {
							if (editlist != null && !err) {
								console.log("IT WORKED, YOU ADDED THE EDITOR!");
								res.status(200).send({ success: true });
							} else {
								res.status('500').send({ success: false, msg: "Error inserting user to viewlist"});
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
			req.dbManager.getComic(comic_creator,comic_uri, function(err,comic: Comic) {
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

		/* POST panel */
		router.post(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/panels\/?$/, upload.single('image'), function(req, res, next) {
			var comic_creator = parseComicCreator(req.url);
			var comic_uri = parseComicURI(req.url);
			if (!comic_creator||!comic_uri==null)
				return next();
			if (!req.file)
				return res.status(400).redirect(req.get('referer'));
			if (!req.file.filename||!req.file.path)
				return res.status(400).redirect(req.get('referer'));
			console.log("DETAILS OF FILE UPLOAD!");
			console.log("path:" + req.file.path);
			console.log("filename: " + req.file.filename);
			var path:string = req.file.path;
			var name:string = req.file.filename;
			sizeOf(path,function(err,dimensions){
				//bound image dimensions:
				if (dimensions.width>MAX_IMAGE_WIDTH)
					return res.status(413).send("Error: image width cannot exceed " + MAX_IMAGE_WIDTH);
				if (dimensions.width>MAX_IMAGE_HEIGHT)
					return res.status(413).send("Error: image height cannot exceed " + MAX_IMAGE_HEIGHT);
				req.dbManager.getComic(comic_creator, comic_uri, function(err,comic: Comic){
					if (err||!comic){
						//TODO: combine this check with permissions
						return res.status(404).send('Comic does not exist: '
							+comic_uri+" (author: " + comic_creator+")");
					} else if (!comic.getUserCanEdit(req.user.getUsername())) {
						//check permissions:
						return res.status(401).send();
					} else {
						console.log("Inserting image..." + name);
						req.dbManager.postPanel(comic_creator,comic_uri,1,path,function(err,panel_id){
							if (panel_id!=null&&!err) {
								console.log("Inserted image " + name);
								var n_manager:NotificationManager = req.nManager;
								n_manager.signalUpdate(comic_uri, function(err,event_id) {
									if (err|| !event_id) {
										console.log("Not updating " + comic_uri);
										n_manager.signalPublish(comic_uri, function(err,event_id){ 
											//signalling publishing
											if (err|| !event_id) {
												console.log("Not Publishing " + comic_uri);
												res.redirect(req.get('referer')); 
												//user should refresh:
											} else {
												console.log("Publishing " + comic_uri);
												res.redirect(req.get('referer')); 
												//user should refresh:
											}
										});
									} else { 
										console.log("updating " + comic_uri);
										n_manager.signalPublish(comic_uri, function(err,event_id){ 
										//signalling publishing
											if (err|| !event_id) {
												console.log("Not Publishing " + comic_uri);
												res.redirect(req.get('referer')); 
												//user should refresh:
											} else {
												console.log("Publishing " + comic_uri);
												res.redirect(req.get('referer')); 
												//user should refresh:
											}	
										}); // end publish
									}
								});
							} else {
								console.log("Error inserting panel!");
								console.log(err);
								res.status('500').send("Error inserting panel");
							}
						});
					}
				}); 
			});
		});

		/* GET panel */
		router.get(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/panels\/[0-9]+$/, function(req,res,next) {
			var comic_creator = parseComicCreator(req.url);
			var comic_uri = parseComicURI(req.url);
			var panel = parsePanelID(req.url);
			if (!comic_creator||!comic_uri||panel==null)
				return next();

			// TODO(NaOH): retrieving the panels from the database
			// for _each panel_ seems pretty slow to me.
			// caching would be helpful here.
			req.dbManager.getComic(comic_creator, comic_uri, function(err,comic: Comic){
				if (err||!comic){
					//TODO: combine this check with permissions
					return res.status(404).send('Comic does not exist: '
						+comic_uri+" (author: " + comic_creator+")");
				} else if (!comic.getUserCanView(req.user.getUsername())) {
					//check permissions:
					return res.status(401).send();
				} else {
					var path = comic.getPanelPath(Number(panel));
					if (!path)
						return next();
					path=__dirname.substring(0,__dirname.lastIndexOf('/')+1) + path;
					res.sendFile(path);
				}
			});
		})
		
		
		

		/* GET pretty search results */
		router.get('/search/*', function(req, res, next) {
			var results = RouteComic.searchFor(req.url.substring('/search/'.length))
			res.render('prettysearch', {
				title: 'pretty search',
				searchresults: results
			});
		})
	
		/* POST Subscription */
		router.post(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/subscribe$/, function(req, res, next) {
			console.log("User is attempting to subscribe");
			var comic_uri = parseComicURI(req.url);
			var n_manager:NotificationManager = req.nManager;
			n_manager.subscribeComic(comic_uri, req.user.getUsername(), function(err,event_id) {
				if (err||!event_id)
					return res.status(400).send({success: false});
				return res.status(200).send({success: true});
			}); 
		});


		this.router_ = router;
	}
	
	getRouter(){
		return this.router_;
	}
}
module.exports=RouteComic
