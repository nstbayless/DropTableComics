///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 

//displays some pretty webpage

var express = require('express');

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
         linktext:"search result "+i,
         description:"description "+i,
         href:"/pretty/"
       }
       results.push(result);
     }
     return results;
  }
  constructor() {
    var router = express.Router();
    /* GET pretty home page. */
    router.get('/', function(req, res, next) {
      res.render('pretty', {
        title: 'pretty page'
      });
    });
    
    /* GET pretty search results */
    router.get('/search/*', function(req,res,next) {
      var results = RoutePretty.searchFor(req.url.substring('/pretty/search/'.length))
      res.render('prettysearch', {
        title: 'pretty search',
        searchresults: results
      });
    })
  
    this.router_=router;
  }
  getRouter(){
    return this.router_;
  }
}

module.exports=RoutePretty
