///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 
  
var express = require('express');
var AuthID = require('../mongoose/authschema.ts');

class RouteIndex {
  router_: any;
  constructor(){
    var router = express.Router();


    /* POST authentication. */
    //adapted without permission from https://devdactic.com/restful-api-user-authentication-1/
    router.post('/register', function(req, res, next) {
      if (!req.body.username || !req.body.password)
        res.json({success: false, msg: 'Provide username and password'});
      else {
        //create userIDAuth in database
        var newAuthID = new AuthID({
          name: req.body.username,
          password: req.body.password
        });
        //TODO(NaOH): look up user data in backend to check for conflicts.
        //TODO(NaOH): make new user data in backend
        newAuthID.save(function(err){
          if (err) {
            return res.json({success: false, msg: 'Mongoose Error'});
          }
          res.json({success: true, msg: 'Successfully created new user.'});
        })
      }
    });
   
    this.router_ = router;
  }
  getRouter(){
    return this.router_;
  }
}

module.exports=RouteIndex
