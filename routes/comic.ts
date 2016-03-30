///<reference path='../types/node/node.d.ts'/>

///<reference path='../types/express/express.d.ts'/> 

//displays dashboard

var MAX_FILE_SIZE = 2*1000*1000//2 mb
var MAX_IMAGE_WIDTH=1200;
var MAX_IMAGE_HEIGHT=800;

import {User } from'../src/User' ;
import {Artist } from'../src/User' ;
import { Comic } from '../src/Comic';
import { Comment, Page, Panel, Overlay } from '../src/Page';
import { NotificationManager } from '../src/NotificationManager';
import { Notification } from '../src/Notification';
import { EventSignal } from '../src/EventSignal';
import { EventType } from '../src/EventType';

var express = require('express');
var config = require('../config');
var fs = require('fs');
var sizeOf = require('image-size');
var multer = require('multer');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
    cb(null, './data/images')
  },
	filename: function (req, file, cb) {
		console.log(file);
    cb(null, Date.now() + "--"+file.originalname)
  }
})
var upload = multer({
  dest: './data/images/',
  limits: {
		fileSize: MAX_FILE_SIZE,
		files: 1
	},
	storage:storage
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

// Prases page # from uri
function parsePageID(url: string):string {
	var res = url.split("/");
	var id = res.indexOf("pages");
	if (!id)
		return null;
	if (res.length <= id)
		return null;
	var page = res[id + 1];
	return page; 

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
			req.dbManager.getSubscriptions(username, function(err, comic_ids) {
				req.dbManager.getUser(username, function(err, user) {
					if (err || !user) return res.status(401).send({ success: false, msg: 'User does not exist' });
					var isartist = user.isArtist();
					req.dbManager.getComics(username, function(err, comics) {
						req.nManager.getNotifications(username, function(err, notifications: Notification[]) {
							if (err || !notifications)
								return res.status(500).send("Error: notifications not found")
							var sorted_notifications: Notification[] = notifications.sort((n1, n2) => {
								if (n1.timestamp.valueOf() < n2.timestamp.valueOf()) {
									return 1;
								}
								if (n1.timestamp.valueOf() > n2.timestamp.valueOf()) {
									return -1;
								}
								return 0;
							});
							res.render('dashboard', {
								"username": req.user.getUsername(),
								"name": req.user.getName(),
								"description": req.user.getDescription(),
								"email": req.user.getEmail(),
								"location": req.user.getLocation(),
								"timezone": req.user.getTimeZone(),
								"link": req.user.getLink(),
								"shouldShowSubscription": req.user.subscriptionChoice(),
								"subscriptions": comic_ids,
								"isartist": isartist,
								"notifications": sorted_notifications,
								title: 'dashboard',
								comics: comics,		// Render list of comics created by user
								comics_length: comics.length,
								notifications_length: notifications.length
							});

						});
					});
				});
			});
		});
		
		/* GET search results */
		router.get(/^\/comics\/search\=[a-zA-Z0-9\-]*/, function(req, res, next) {
			var username:string = req.user.getUsername();
			var list = req.url.split("=");
			var query = list[1];
			var query2 = query.split("%20");
			query = "";
			for (var i = 0; i < query2.length; i++){ // parsing query
				query = query + query2 + " "; 
			}
			console.log(query);
			req.dbManager.searchFor(username, query, function(err, results) { // results are comics
				console.log(results);				
				res.render('searchresults', {
					title: 'search',
					comics: results
				});
			});
		})
		/* GET advanced search results */
		router.get(/^\/comics\/asearch\=[a-zA-Z0-9\-]*/, function(req, res, next) {
			var username:string = req.user.getUsername();
			var list = req.url.split("=");
			var query = list[1];
			var list2 = query.split("?");
			query = list2[0];
			var query2 = query.split("%20");
			query = "";
			for (var i = 0; i < query2.length; i++){ // parsing query
				query = query + query2 + " "; 
			}
			var criteria = new Array<String>();
			for(var i = 1; i < list2.length; i++){ // parsing criteria
				criteria[i-1]=list2[i];
			}
			console.log(query + " " + criteria.length);
			req.dbManager.searchAdvanced(criteria, username, query, function(err, results) { // results are comics
				console.log(results);				
				res.render('searchresults', {
					title: 'search',
					comics: results
				});
			});
		})
				
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
		router.get(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*(\/pages\/[0-9]*)?\/edit\/?$/, function(req, res, next) {
			var pageid=1;
			if (req.url.indexOf("/pages/")>-1)
				pageid=parseInt(req.url.split("/pages/")[1]);
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri || !comic_creator)
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				if (pageid<1)
					return next();
				if (!comic.getDraftPage(pageid))
					return next();
				var page: Page = comic.getDraftPage(pageid);
				var comments: Comment[] = page.getComments();
				return res.render('editcomic', {
					title: comic.getName(),
					editcomments: comments,
					username: req.user.getUsername(),
					comic_creator: comic_creator,
					comic_name: comic.getName(),
					comic_uri: comic.getURI(),
					//TODO: change to getUserCanAdmin()
					adminable: comic.getUserCanEdit(req.user.getUsername()),
					pageid: pageid,
					maxpageid: comic.getDraftPages().length,
					panels: page.getPanels(),
					edited: page.edited,
					url_append: "/edit"
				})
			})
		});

		/* GET pretty comic page */
		router.get(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*(\/(pages\/[0-9]*)?\/?)?$/, function(req, res, next) {
			var pageid=1;
			if (req.url.indexOf("/pages/")>-1)
				pageid=parseInt(req.url.split("/pages/")[1]);
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri || !comic_creator)
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanView(req.user.getUsername()))
					return next();
				if (pageid<1)
					return next();
				if (!comic.getPage(pageid))
					return next();
				var page: Page = comic.getPage(pageid);
				var panels: Panel[] = page.getPanels();
				var overlays: Overlay[] = page.getOverlays();
				// preloading
				var next_page:Page;
				var next_panels:Panel[]=[];
				if (!(pageid == comic.getPages().length)) {
					next_page = comic.getPage(pageid+1);
					next_panels = next_page.getPanels();
				}
				var comments: Comment[] = page.getComments();
				return res.render('viewcomic', {
					title: comic.getName(),
					description: comic.getDescription(),
					editlist: comic.getEditlist(), 
					comments: comments,
					username: req.user.getUsername(),
					comic_creator: comic_creator,
					comic_name: comic.getName(),
					comic_uri: comic.getURI(),
					share_link: req.get('host') + req.url,
					editable: comic.getUserCanEdit(req.user.getUsername()),
					pageid: pageid,
					maxpageid: comic.getPages().length,
					panels: panels,
					overlays: overlays,
					next_panels:next_panels,
					pagename: page.getTitle(),
					url_append: "/"
				})
			});
		});

		/* DELETE draft (reverts to published version of page) */
		router.delete(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*(\/pages\/[0-9]*)?\/draft\/?$/, function(req, res, next) {
			var pageid=1;
			if (req.url.indexOf("/pages/")>-1)
				pageid=parseInt(req.url.split("/pages/")[1]);
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri || !comic_creator)
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				if (pageid<1)
					return next();
				if (!comic.getDraftPage(pageid))
					return next();
				var page: Page = comic.getPage(pageid);
				//paste over draft page to database
				req.dbManager.putDraft(comic_creator,comic_uri,pageid,page,function(err) {
					//success; inform user of URI of new page
					if (!err){
						req.nManager.signalUpdate(comic_uri, function(err, notification) {
							if (!err) { res.status(200).send(); }
							else res.status(400).send({msg: "error signalling update"});
						}); 				
					} else
						res.status(500).send({msg: "unknown error occurred putting page"})
				});
			})
		});

		/* GET draft comic json object */
		router.get(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*(\/pages\/[0-9]*)?\/draft\/json?$/, function(req, res, next) {
			var pageid=1;
			if (req.url.indexOf("/pages/")>-1)
				pageid=parseInt(req.url.split("/pages/")[1]);
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri || !comic_creator)
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				if (pageid<1)
					return next();
				if (!comic.getDraftPage(pageid))
					return next();
				var page: Page = comic.getDraftPage(pageid);
				return res.status(200).send({draft: page});
			})
		});

		/* PUT draft*/
		router.put(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/pages\/[0-9]+\/draft\/json\/?$/, function(req, res, next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri || !comic_creator)
				return next();
			var pageid=1;
			if (req.url.indexOf("/pages/")>-1)
				pageid=parseInt(req.url.split("/pages/")[1]);
			else
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				//add page to database
				req.body.draft.edited=true;
				req.dbManager.putDraft(comic_creator,comic_uri,pageid,req.body.draft,function(err) {
					//success; inform user of URI of new page
				
					if (!err){
						req.nManager.signalUpdate(comic_uri, function(err, notification) {
						if (!err) { res.status(200).send(); }
						else res.status(400).send({msg: "error signalling update"});
						});}
					else
						res.status(500).send({msg: "unknown error occurred putting page"})
				});
			});
		});

		/* POST new page */
		router.post(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/pages\/?$/, function(req, res, next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri || !comic_creator)
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				//add page to database
				req.dbManager.postPage(comic_creator,comic_uri,function(err,new_page_id) {
					//success; inform user of URI of new page
					if (!err){
						req.nManager.signalUpdate(comic_uri, function(err, notification) {
						if (!err) {res.status(200).send({new_page_id:new_page_id}); }
						else res.status(400).send({msg: "error signalling update"});
						});}

					else
						res.status(500).send({msg: "unknown error occurred posting page"})
				});
			});
		});

		/* DELETE page */
		router.delete(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/pages\/[0-9]+\/?$/, function(req, res, next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			var pageid=1;
			if (req.url.indexOf("/pages/")>-1)
				pageid=parseInt(req.url.split("/pages/")[1]);
			else
				return next();
			if (!comic_uri || !comic_creator)
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				//delete page in database
				req.dbManager.deletePage(comic_creator,comic_uri,pageid,function(err) {
					//success; inform user of URI of new page
					if (!err){
						req.nManager.signalUpdate(comic_uri, function(err, notification) {
						if (!err) { res.status(200).send(); }
						else res.status(400).send({msg: "error signalling update"});
						});}
					else
						res.status(err.getCode() | 500).send(err)
				});
			});
		});

		/* POST job: publish page */
		router.post(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/pages\/[0-9]+\/publish\/?$/, function(req, res, next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			var pageid=1;
			if (req.url.indexOf("/pages/")>-1)
				pageid=parseInt(req.url.split("/pages/")[1]);
			else
				return next();
			if (!comic_uri || !comic_creator)
				return next();
			req.dbManager.getComic(comic_creator, comic_uri, function(err, comic: Comic) {
				if (err || !comic)
					return next();
				if (!comic.getUserCanEdit(req.user.getUsername()))
					return next();
				//add page to database
				req.dbManager.publishPage(comic_creator,comic_uri,pageid,function(err) {
					
					//success; inform user of URI of new page
					if (!err){
						req.nManager.signalPublish(comic_uri, function(err, notification) {
						if (!err) { res.status(200).send(); }
						else res.status(400).send({msg: "error signalling update"});
						});}
					else
						res.status(err.getCode() | 500).send(err)
				});
			});
		});

		router.get(/^\/editdashboard\/?$/, function(req, res, next) {
			res.render('editdashboard');
		});

		//TODO(tina): this is not a RESTful URI~! should PUT to /account/(username)
		// POST (should be PUT) changes to user profile
		router.post(/^\/editdashboard\/?$/, upload.single('image'), function(req, res, next) {
			var username: string = req.user.getUsername();
			var path:string = "";
			if(req.file)
				path = req.file.path;
			req.dbManager.postAvatar(username, path, req.body, function(err, avatar) {
				if (err)
					res.status(500).send("error uploading changes to profile");
				else //TODO(tina): server redirect is bad practice. Client should redirect itself.
					res.redirect('/');
			});
		});

		/* GET user profile page */
		router.get(/^\/profile\/[a-zA-Z0-9~]+\/?$/, function(req,res,next) {
			//TODO: parse URI properly
			var username = req.url.substr('/profile/'.length).replace(/\//g,'');
			req.dbManager.getUser(username, function(err, user) {
				if (err||!user) 
					return next();
				 res.render('profile', {
					"username": user.getUsername(),
					"name": user.getName(),
					"description": user.getDescription(),
					location: user.getLocation(),
					"email": user.getEmail(),
					"link": user.getLink(),
					title: "User: " + user.getUsername()
				// TODO: Render list of comics created by user viewable by visitor 
				});
			})
		});

		/* GET user avatar */
		router.get(/^\/accounts\/[a-zA-Z0-9~]+\/avatar\/?$/, function(req,res,next) {
			//TODO: parse URI properly
			var username = req.url.substr('/profile/'.length).replace("/avatar","").replace(/\//g,'').trim();
			req.dbManager.getUser(username,function(err,user){
				if (err||!user)
					return next();
				var path = user.getAvatar();
				if (!path)
					path = "public/images/default_avatar.png"
				path=__dirname.substring(0,__dirname.lastIndexOf('/')+1) + path;
				res.sendFile(path);
			})
		});

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
			var path:string = req.file.path;
			var name:string = req.file.filename;
			//page to add panel to:
			var pageid = req.body.page || 1
			sizeOf(path,function(err,dimensions){
				if (!dimensions)
					return res.status(401).send("Malformed request");
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
					}	else if (pageid<1||pageid>comic.getPages().length) {
						return res.status(404).send("unknown page no. " + pageid);
					} else {
						req.dbManager.postPanel(comic_creator,comic_uri,pageid,path,function(err,panel_id){
							if (panel_id!=null&&!err) {
								req.nManager.signalUpdate(comic_uri, function(err, notification) {
									if (!err) {
										res.redirect(req.get('referer'));  //user should refresh: 
									} else res.status(400).send({msg: "error signalling update"});
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
			req.dbManager.getComic(comic_creator, comic_uri, function(err,comic: Comic) {
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


		/* POST Comment on viewpage */
		router.post(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/pages\/[0-9]+\/comment$/, function(req, res, next) {
			var username = req.user.getUsername();
			var comic_creator = parseComicCreator(req.url);
			var comic_uri = parseComicURI(req.url);
			var pageid = pageid = parseInt(req.url.split("/pages/")[1].split("/comment")[0]);
			req.nManager.subscribeComments(comic_uri + pageid.toString(), username, function(err, event){
				req.nManager.signalNewComment(comic_uri +pageid.toString(), function(err, notification) {
					if (!err) {
							console.log(req.url);
							if (!req.body.comment) {
								return next();
							} else {
								console.log("checking adminlevel...");
								req.dbManager.postComment(
									comic_creator, 
									comic_uri, 
									pageid, 
									username, 
									req.body.comment, 
									0, 
									function(err){
										if (err) {
										res.status(500).send({success: false, 
													msg: "Posting Comment Error"})
										} else (
										res.status(200).send({ success: true })
										)
								})
							}
							}
					else res.status(400).send({msg: "error signalling update"});
					}); 		
				});	
		})

		/* POST Comment on editpage*/
		router.post(/^\/accounts\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/pages\/[0-9]+\/edit\/comment$/, function(req, res, next) {
			var adminlevel: number = 0;
			var username = req.user.getUsername();
			var comic_creator = parseComicCreator(req.url);
			var comic_uri = parseComicURI(req.url);
			console.log(req.url);
			var pageid = pageid = parseInt(req.url.split("/pages/")[1].split("/edit/")[0]);
			req.nManager.subscribeEditComments(comic_uri + pageid.toString(), username, function(err, event){
				req.nManager.signalNewEditComment(comic_uri +pageid.toString(), function(err, notification) {
					if (!err) {
						if (!req.body.comment) {
							return next();
						} else {	
							console.log("checking adminlevel...");
							req.dbManager.postComment(comic_creator, 
											comic_uri, 
											pageid, 
											username, 
											req.body.comment, 
											1, 
											function(err) {
								if (err) {
									res.status(500).send({ success: false, msg: "Posting Comment Error" })
								} else (
									res.status(200).send({ success: true })
								)
						})
						}
					}
				});
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
