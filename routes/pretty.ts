///<reference path='../types/node/node.d.ts'/>

///<reference path='../types/express/express.d.ts'/> 

//displays dashboard

var express = require('express');
var config = require('../config');
import {User } from'../src/User' ;
import {Artist } from'../src/User' ;
import { Comic } from '../src/Comic';
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var fs = require('fs');

//struct for a single result in a list of search results
class SearchResult{
linktext: string;
description: string;
href: string;
}

// Parses comic name from uri
function parseComicName(url: string):string {
	var res = url.split("/");
	return res[3]; // stub TODO: Add dash/space checking parseComicName
}

function generateComicURL(name: string, creator: string):string {
	return name; // stub TODO: Implement generateComicURL and use in other methods
}

// Parses comic name from uri
function parseComicCreator(url: string):string {
	var res = url.split("/");
	return res[2];// stub TODO: Add dash/space checking parseComicCreator
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
			var comics = req.db.get('comics');
			comics.find({creator:username},{},function(e,docs){
				res.render('dashboard', {
					title: 'dashboard',
					editable: docs		// list of comics created by use	
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
			var isartist = req.user.isArtist(); // true if user is an artist
			var comic_name = parseComicName(req.url);
			var comic_creator = parseComicCreator(req.url);
			var image_collection = req.dbManager.db.get(comic_creator + '_' + comic_name);
			var x;
			image_collection.find({}, { stream: true })
			.each(function(myDoc){
			var img = myDoc;
				console.log('IMAGE PATH ACCORDING TO EDIT IS ' + img.path);
				console.log("DOWNLOADING IMAGE FROM " + img.path);
				var source = fs.createReadStream(img.path);
				x ='public\\' + img.path;
				var dest = fs.createWriteStream(x); 													// TODO: Make path more legit
				source.pipe(dest);
				console.log("IMAGE DOWNLOADED TO CLIENT AT:" + x);
				x = img.path;
				source.on('end', function() {console.log("IMAGE DOWNLOADED TO CLIENT AT:" + x)});
				source.on('error', function(err) { console.log("ERROR: " + err) });
			});
			if (comic_creator == req.user.getUsername()){									// TODO: (Edward) Make legit permission check				
				image_collection.find({},{},function(e,docs){ 					// TODO: Load images and render them
					return res.render('newcomic', {									// TODO: (Edward) Make legit permission check
						title: comic_name,
						comic_creator: comic_creator,
						comic_name: comic_name,
						isartist:isartist,
						panels: docs															// list of comics created by use									});
					}); 
				});	
			}
			else res.send({success: false, msg: 'This is not your comic!'});
		});
		
		/* GET pretty comic edit page */
		router.get('/edit/*', function(req,res,next) {
			var isartist = req.user.isArtist(); // true if user is an artist
			var comic_name = parseComicName(req.url);
			var comic_creator = parseComicCreator(req.url);
			var image_collection = req.dbManager.db.get(comic_creator + '_' + comic_name);
			var x;
			image_collection.find({}, { stream: true })
			.each(function(myDoc){
			var img = myDoc;
				console.log('IMAGE PATH ACCORDING TO EDIT IS ' + img.path);
				console.log("DOWNLOADING IMAGE FROM " + img.path);
				var source = fs.createReadStream(img.path);
				x ='public\\' + img.path;
				var dest = fs.createWriteStream(x); 													// TODO: Make path more legit
				source.pipe(dest);
				console.log("IMAGE DOWNLOADED TO CLIENT AT:" + x);
				x = img.path;
				source.on('end', function() {console.log("IMAGE DOWNLOADED TO CLIENT AT:" + x)});
				source.on('error', function(err) { console.log("ERROR: " + err) });
			});
			if (comic_creator == req.user.getUsername()){									// TODO: (Edward) Make legit permission check				
				image_collection.find({},{},function(e,docs){ 					// TODO: Load images and render them
					return res.render('editcomic', {									// TODO: (Edward) Make legit permission check
						title: comic_name,
						comic_creator: comic_creator,
						comic_name: comic_name,
						panels: docs															// list of comics created by use									});
					}); 
				});	
			}
		});																					// TODO: Get comi from database		
		
		
		/* POST Comic. */
		router.post('/comic', function(req, res, next) {
			//TODO: check for reserved characters while parsing names
			if (!req.body.comic_name) //incorrect POST body
			res.send({success: false, msg: 'Provide comic name'});
			else if (!req.user.isArtist) //incorrect account type
			res.send({success: false, msg: 'account_type must be"artist"'});
			else {
				// check if user is signed in
				if (!req.user)
				return res.send({success: false, msg: 'Please sign-in to create a comic'})
				req.dbManager.getComic(req.body.comic_name, req.user.getUsername(), function(err,comic){
					if (comic){
						console.log("I found the comic, suckers!");
						return res.send({success:false, msg: 'Comic already exists'});
					}
					console.log("I couldn't find the comic");
					comic = req.dbManager.createComic(req.body.comic_name,req.user.getUsername(),req.body.description);
					res.send({success: true})
				});
			} 
		});
		
	
		/* POST Image */
		router.post('/file-upload/*',upload.single('thumbnail'), function(req, res, next) {
			var comic_creator = parseComicCreator(req.url);
			var comic_name = parseComicName(req.url);
			var image_collection = comic_creator + "_" + comic_name;
			console.log("DETAILS OF FILE UPLOAD!");
			console.log(req.file.path);
			console.log(req.file.filename);
			var path:string = req.file.path;
			var name:string = req.file.filename;
			req.dbManager.getComic(comic_name,comic_creator, function(err,comic){
				if (!comic){
					return res.send({success:false, msg: 'Comic does not exist'});
				}
				else {
					console.log("Inserting image..." + name);
					req.dbManager.insertImage(image_collection, path, name); // TODO: create naming system for multiple names
					console.log("Inserted image " + name);
					res.redirect('back');
				}
			}); 
		});
		this.router_ = router;
}
	
	getRouter(){
		return this.router_;
	}
}
module.exports=RoutePretty
