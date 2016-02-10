///<reference path='../types/node/node.d.ts'/>

///<reference path='../types/express/express.d.ts'/> 

//displays dashboard

var express = require('express');
var config = require('../config');
import {User } from'../src/User' ;
import {Artist } from'../src/User' ;
import { Comic } from '../src/Comic';
var multer  = require('multer');
var upload = multer({ dest: './data/images/' });
var fs = require('fs');

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

class RoutePretty {
	router_: any;
	static searchFor(searchtext: string): SearchResult[] {
		var results: SearchResult[] = []
		for (var i=0;i<12;i++) {
			//make random search results
			var result: SearchResult = {
				linktext:"search result " + i,
				description:"description " + i,
				href:"/pretty/"
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
			var isartist = req.user.isArtist();  // whether the user is a pleb
			//TODO: should use a dbManager method here, not dbManager
			var comics = req.db.get('comics');
			comics.find({creator:username},{},function(err,comics){
				res.render('dashboard', {
					title: 'dashboard',
					comics: comics		// list of comics created by user	
				});
			});    
		});
		
		/* GET create comic page. */
		router.get('/create', function(req, res, next) {
			var username = req.user.getUsername();  // artist username
			var isartist = req.user.isArtist(); // true if user is an artist
			if (isartist){   
				res.render('createcomic', {
					title: 'Create Comic'
				});
			}		
		});
		
		/* GET pretty search results */
		router.get('/search/*', function(req,res,next) {
			var results = RoutePretty.searchFor(req.url.substring('/pretty/search/'.length))
			res.render('prettysearch', {
				title: 'pretty search',
				searchresults: results
			});
		})
			
		/* GET pretty comic page */
		router.get('/see/*', function(req,res,next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri||!comic_creator)
				return next();
			if (comic_creator == req.user.getUsername()) { // TODO: (Edward) Make legit permission check				
				req.dbManager.getComic(comic_creator,comic_uri,function(err,comic){
					if (err||!comic)
						return next();
					//TODO: rename 'newcomic' to 'viewcomic' or something
					return res.render('newcomic', {	
						title: comic.getName(),
						comic_creator: comic_creator,
						comic_name: comic.getName(),
						comic_uri: comic_uri,
						share_link: req.get('host') + req.url,
						panels: comic.getPage(1)
					})
				})
			} else res.status(401).send("This is not your comic!")
		});
		
		/* GET pretty comic edit page */
		router.get('/edit/*', function(req,res,next) {
			var comic_uri = parseComicURI(req.url);
			var comic_creator = parseComicCreator(req.url);
			if (!comic_uri||!comic_creator)
				return next();
			if (comic_creator == req.user.getUsername()) { // TODO: (Edward) Make legit permission check				
				req.dbManager.getComic(comic_creator,comic_uri,function(err,comic){
					if (err||!comic)
						return next();
					return res.render('editcomic', { 
						title: comic.getName(),
						comic_creator: comic_creator,
						comic_name: comic.getName(),
						comic_uri: comic_uri,
						panels: comic.getPage(1)
					})
				})
			} else res.status(401).send("This is not your comic!")
		});		
		
		/* POST Comic. */
		//TODO: this is not restful. URI location is /<user-name>/comics/
		router.post('/comic', function(req, res, next) {
			if (!req.body.comic_name) //incorrect POST body
			res.status(413).send({success: false, msg: 'Provide comic name'});
			else if (!req.user.isArtist) //incorrect account type
			res.status(413).send({success: false, msg: 'account_type must be"artist"'});
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
					var url_comic_redirect=("/pretty/see/"+req.user.getUsername()+"/comics/"+comic.getURI());
					res.status(200).send({success: true,comic_url:url_comic_redirect})
				});
			} 
		});
	
		/* POST panel */
		router.post(/^\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/panels\/?$/,
      upload.single('image'), function(req, res, next) {
			//TODO(Edward): check permissions when uploading panel.
			var comic_creator = parseComicCreator(req.url);
			var comic_uri = parseComicURI(req.url);
			if (!comic_creator||!comic_uri==null)
				return next();
			console.log("DETAILS OF FILE UPLOAD!");
			console.log("path:" + req.file.path);
			console.log("filename: " + req.file.filename);
			var path:string = req.file.path;
			var name:string = req.file.filename;
			//TODO: check submission is not empty (500 error occurs currently)
			req.dbManager.getComic(comic_creator, comic_uri, function(err,comic){
				if (err||!comic){
					return res.status(404).send('Comic does not exist: '
						+comic_uri+" (author: " + comic_creator+")");
				}
				else {
					console.log("Inserting image..." + name);
					req.dbManager.postPanel(comic_creator,comic_uri,1,path,function(err,panel_id){
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

		/* GET panel */
		router.get(/^\/[a-zA-Z0-9\-]*\/comics\/[a-zA-Z0-9\-]*\/panels\/[0-9]+$/, function(req,res,next) {
			//TODO(Edward): check permissions when getting panel.
			var comic_creator = parseComicCreator(req.url);
			var comic_uri = parseComicURI(req.url);
			var panel = parsePanelID(req.url);
			if (!comic_creator||!comic_uri||panel==null)
				return next();

			// TODO(NaOH): retrieving the panels from the database
			// for _each panel_ seems pretty slow to me.
			// caching would be helpful here.
			req.dbManager.getComic(comic_creator, comic_uri, function(err,comic){
				if (err||!comic){
					return res.status(404).send('Comic does not exist: '
						+comic_uri+" (author: " + comic_creator+")");
				}
				else {
					var path = comic.getPanelPath(panel);
					if (!path)
						return next();
					path=__dirname.substring(0,__dirname.lastIndexOf('/')+1) + path;
					res.sendFile(path);
				}
			});
		})

		this.router_ = router;
}
	
	getRouter(){
		return this.router_;
	}
}
module.exports=RoutePretty
