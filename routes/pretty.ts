///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 

//displays dashboard

var express = require('express');
var config = require('../config');
import {User } from'../src/User' ;
import {Artist } from'../src/User' ;
import { Comic } from '../src/Comic';

//struct for a single result in a list of search results
class SearchResult{
  linktext: string;
  description: string;
  href: string;
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
				editable: docs,		// list of comics created by use	
			});
        });    
    });
	
	/* GET create comic page. */
    router.get('/create', function(req, res, next) {
		var username = req.user.getUsername();  // artist username
		var isartist = req.user.isArtist(); // true if user is an artist
		if (isartist){   
				res.render('createcomic', {
					title: 'create comic'
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
	    res.render('newcomic', {
        title: req.url,
		heading: req.url
      });
    })
	
	
	 /* POST Comic. */
    router.post('/comic', function(req, res, next) {
		//TODO:(Arman): fix nameblah
		console.log(req.body.nameblah);
		if (!req.body.nameblah) //incorrect POST body
			res.send({success: false, msg: 'Provide comic name'});
     else if (!req.user.isArtist) //incorrect account type
     res.send({success: false, msg: 'account_type must be"artist"'});
      else {
        // check if user is signed in
        if (!req.user)
          return res.send({success: false, msg: 'Please sign-in to create a comic'})
        req.dbManager.getComic(req.body.nameblah, req.user.getUsername(), function(err,comic){
            if (comic){
			console.log("I found the comic, suckers!");
			return res.send({success:false, msg: 'Comic already exists'});}
			console.log("I couldn't find the comic");
			comic = req.dbManager.createComic(req.body.nameblah,req.user.getUsername(),req.body.description);
			res.send({success: true})
        });
      } 
    }); 
	 this.router_ = router;
  }
    
  getRouter(){
    return this.router_;
  }
}
module.exports=RoutePretty
