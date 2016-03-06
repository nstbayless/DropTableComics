///<reference path='../types/node/node.d.ts'/>

///<reference path='../types/express/express.d.ts'/> 

//displays dashboard

var MAX_FILE_SIZE = 2*1000*1000//2 mb
var MAX_IMAGE_WIDTH=1200;
var MAX_IMAGE_HEIGHT=800;

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
			var comics = req.db.get('comics');
			req.dbManager.getComics(username, function(err, comics) {
				res.render('dashboard', {
					title: 'dashboard',
					comics: comics		// Render list of comics created by user	
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
					comic = req.dbManager.createComic(req.body.comic_name,req.user.getUsername(),req.body.description);
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
			console.log(req.user.username);
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
				return res.render('editcomic', {
					title: comic.getName(),
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
				return res.render('viewcomic', {
					title: comic.getName(),
					description: comic.getDescription(),
					editlist: comic.getEditlist(), 
					comic_creator: comic_creator,
					comic_name: comic.getName(),
					comic_uri: comic.getURI(),
					share_link: req.get('host') + req.url,
					editable: comic.getUserCanEdit(req.user.getUsername()),
					pageid: pageid,
					maxpageid: comic.getPages().length,
					panels: panels,
					pagename: page.getTitle(),
					url_append: "/"
				})
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
					if (!err)
						res.status(200).send({new_page_id:new_page_id});
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
				//add page to database
				req.dbManager.deletePage(comic_creator,comic_uri,pageid,function(err) {
					//success; inform user of URI of new page
					if (!err)
						res.status(200).send();
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
					if (!err)
						res.status(200).send();
					else
						res.status(err.getCode() | 500).send(err)
				});
			});
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
			console.log("DETAILS OF FILE UPLOAD!");
			console.log("path:" + req.file.path);
			console.log("filename: " + req.file.filename);
			var path:string = req.file.path;
			var name:string = req.file.filename;
			//page to add panel to:
			var pageid = req.body.page || 1
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
					}	else if (pageid<1||pageid>comic.getPages().length) {
						return res.status(404).send("unknown page no. " + pageid);
					} else {
						console.log("Inserting image..." + name);
						req.dbManager.postPanel(comic_creator,comic_uri,pageid,path,function(err,panel_id){
							if (panel_id!=null&&!err) {
								console.log("Inserted image " + name);
								//user should refresh:
								res.redirect(req.get('referer'));
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

		/* GET pretty search results */
		router.get('/search/*', function(req, res, next) {
			var results = RouteComic.searchFor(req.url.substring('/search/'.length))
			res.render('prettysearch', {
				title: 'pretty search',
				searchresults: results
			});
		})
	
		this.router_ = router;
	}
	
	getRouter(){
		return this.router_;
	}
}
module.exports=RouteComic
