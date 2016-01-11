///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 

//displays some pretty webpage

var express = require('express');
var router = express.Router();

class PrettyRouter {
  constructor(){
    //nothing yet
  }
  start(){
    /* GET pretty home page. */
    router.get('/', function(req, res, next) {
      res.render('pretty', {
        title: 'pretty page'
      });
    });
  
    module.exports = router;
  }
}

var router_ = new PrettyRouter();
router_.start();
