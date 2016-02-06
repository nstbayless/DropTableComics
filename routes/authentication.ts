///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 
  
var express = require('express');
var config = require('../config');
import User = require('../src/User')

class RouteAuth {
  router_: any;
  //sets the cookie to store credentials in user's browser
  static setAuthenticationCookie(req,res,username,password){
    if (username){
     res.cookie('credentials',{
       username: username,
       password: password,
     }, {
       maxAge: 900000,
       httpOnly: true,
       secure: config.https,
       path: '/'
     });
    }
  }

  //asynchronously attempts to validate user credentials. 
  //attaches user object to request if valid
  //attaches user info to the headers for the next http data sent
  //callback [](authenticated):
  //  authenticated is true if user is successfuly authenticated.
  static authorizeUser(req,res,callback){
    var username = ""
    var password = ""
    if (req.body.username && req.body.password) {
      //creds included in request body
      username=req.body.username;
      password=req.body.password;
    } else if (req.cookies.credentials) {
      var creds = req.cookies.credentials;
      //creds included in cookies
      if (creds.username && creds.password) {
        username = creds.username;
        password = creds.password;
      }
    }

    req.dbManager.getUser(username, function(err,user) {
      if (user&&!err) {
        if (req.dbManager.checkHash(password,user.getHash())) {
          //user is valid!
          req.user = user
		 
          //tell client about client-specific information in all future responses
		  var isartist = req.user.isArtist();
		  console.log(isartist);
		  res.append('isartist',isartist);
          res.append('username',username);
          res.append('authenticated',true);
          return callback(true);
        }
      }
      //default information
      res.append('username','')
      res.append('authenticated',false)
      callback(false);
    });
  }

  constructor(){
    var router = express.Router();

    /* (custom middleware) Authentication. Checks for credentials in cookie or body.*/
    router.use(function(req, res, next) {
      RouteAuth.authorizeUser(req,res,function(authenticated) {
        next();
      });
    });

    /* GET login page. */
    router.get('/auth/login', function(req, res, next) {
      if (!req.user)
        res.render('simplelogin', {
          title: 'Log In'
        });
      else //user already logged in, no need to see this page.
        res.redirect('/')
    });

    /* GET registration page. */
    router.get('/auth/register', function(req, res, next) {
      if (!req.user)
        res.render('simpleregister', {
          title: 'register'
        });
      else //user already logged in, no need to see this page.
        res.redirect('/')
    });

    /* POST login. (POSTs a new session) */
    router.post('/auth/login', function(req, res, next) {
      if (!req.body.username || !req.body.password) //incorrect POST body
        res.send({success: false, msg: 'Please provide username and password'});
      else {
        RouteAuth.authorizeUser(req,res,function(authenticated){
          console.log(authenticated);
          if (authenticated) {
            RouteAuth.setAuthenticationCookie(req,res,req.body.username,req.body.password);
            res.send({success: true, msg: 'Valid Credentials!'})
          } else {
            res.send({success: false, msg: 'Incorrect username or password'})
          }
        });
      }
    });

    /* GET logout (this just deletes the credentials cookie in the broswer). */
    router.get('/auth/logout', function(req, res, next) {
       //overwrite old cookie, just to be sure
       res.cookie('credentials',{
         username: "?",
         password: "?",
       }, {
         maxAge: 1,
         httpOnly: true,
         path: '/'
       });
       //erase cookie
       res.clearCookie('credentials',{
         maxAge: 900000,
         httpOnly: true,
         path: '/'
       });
       res.send({success: false, msg: 'Clearing cookies'})
    });

    /* POST registration. */
    router.post('/auth/accounts', function(req, res, next) {
      if (req.user)//user already registered:
        res.send({success: false,
          msg: 'Registration not necessary. Credentials already validated'})
      else if (!req.body.username || !req.body.password) //incorrect POST body
        res.send({success: false, msg: 'Provide username and password'});
      else if (!req.body.email) //incorrect POST body
        res.send({success: false, msg: 'Provide email address'});
      else if (!req.body.email.match(/\S+@\S+\.\S+/)) //email address of wrong form
        res.send({success: false, msg: 'Provide email address of the form *@*.*'});// no account type specified
      else if (req.body.account_type!="pleb"&&req.body.account_type!="artist")
        res.send({success: false, msg: 'account_type must be one of "pleb" or "artist"'});
      else {
        //register new user!
        //check username/password are valid
        if (req.body.username.length<3)
          return res.send({success: false, msg: 'Username must be at least 3 characters'})
        if (req.body.password.length<4)
          return res.send({success: false, msg: 'Password must be at least 4 characters'})
        req.dbManager.getUser(req.body.username, function(err,user){
			if (user) {
            res.send({success: false, msg: 'Username already exists!'})
            return;
          }
          //Everything good!
          if (req.body.account_type=="pleb")
            user=req.dbManager.createViewer(req.body.username,req.body.password,req.body.email);
          else
            user=req.dbManager.createArtist(req.body.username,req.body.password,req.body.email);
          if (user) {
            RouteAuth.setAuthenticationCookie(req,res,req.body.username,req.body.password);
            res.send({success: true, msg: 'Account successfuly created!'})
          } else res.send({success: false, msg: 'Unknown error creating account'})
        });
      }
    });
   
    //block all access to app after this point:
    router.get('/*', function(req,res,next) {
      if (!req.user)
        return res.render('simplelogin', {
          title: 'Log In'
        });
      next();
    });
    router.all('/*', function(req,res,next) {
      if (!req.user) {
        res.status(401)
        return res.send("Authentication required");
      }
      next();
    });


    this.router_ = router;
  }
  getRouter(){
    return this.router_;
  }
}

module.exports=RouteAuth
