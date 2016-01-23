///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 
  
var express = require('express');
var AuthID = require('../mongoose/authschema');

class RouteAuth {
  router_: any;
  constructor(){
    var router = express.Router();
    /* GET login page. */
    router.get('auth/register', function(req, res, next) {
      res.render('simpleregister', {
        title: 'pretty page'
      });
    });

    /* POST registration. */
    //adapted without permission from https://devdactic.com/restful-api-user-authentication-1/
    router.post('/auth/register', function(req, res, next) {
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

    /* POST authentication. */
    //adapted without permission from https://devdactic.com/restful-api-user-authentication-1/
    router.post('/auth/authenticate', function(req, res) {
    AuthID.findOne({
      name: req.body.name
    }, function(err, user) {
      if (err) throw err;
      if (!user) {
        res.send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        // check if password matches
        user.comparePassword(req.body.password, function (err, isMatch) {
          if (isMatch && !err) {
            // if user is found and password is right create a token
            var token = jwt.encode(user, config.secret);
            // return the information including token as JSON
            res.json({success: true, token: 'JWT ' + token});
          } else {
            res.send({success: false, msg: 'Authentication failed. Wrong password.'});
          }
        });
      }
    });
  });
   
    this.router_ = router;
  }
  getRouter(){
    return this.router_;
  }
}

module.exports=RouteAuth
