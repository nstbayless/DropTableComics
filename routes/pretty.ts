///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 

//displays some pretty webpage

var express = require('express');
var router = express.Router();

//struct for a single result in a list of search results
class SearchResult{
  linktext: string;
  description: string;
  href: string;
}

class PrettyRouter {
  constructor(){
    //nothing yet
  }
  static searchFor(searchtext: string): SearchResult[] {
     var results: SearchResult[] = []
     for (var i=0;i<12;i++) {
       //make random search results
       var result: SearchResult = {
         linktext:"text",
         description:"description "+i,
         href:"/pretty/"
       }
       results.push(result);
     }
     return results;
  }
  start(){
    /* GET pretty home page. */
    router.get('/', function(req, res, next) {
      res.render('pretty', {
        title: 'pretty page'
      });
    });
    
    /* GET pretty search results */
    router.get('/search/*', function(req,res,next) {
      var results = PrettyRouter.searchFor(req.url.substring('/pretty/search/'.length))
      console.log(results);
      res.render('prettysearch', {
        title: 'pretty search',
        searchresults: results
      });
    })
  
    module.exports = router;
  }
}

var prouter_ = new PrettyRouter();
prouter_.start();
