///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 
  
var express = require('express');

class RouteAuth {
  router_: any;
  //sets the cookie to store credentials in user's browser
  static setAuthenticationCookie(req,res,user){
    if (user && user.username){
     res.cookie('credentials',{
       username: user.username,
       password: user.password,
     }, {
       maxAge: 900000,
       httpOnly: true,
       path: '/'
     });
    }
  }
  //attempts to validate user credentials. 
  //attaches user object to request if valid
  //sends user info back to client
  //returns true if valid, false otherwise
  static authorizeUser(req,res){
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
        username=creds.username;
        password=creds.password;
      }
    }
    //TODO(NaOH): validate user
    if (username=="johnny" && password=="dichotomy") {
      //user is valid!
      //TODO: swap out for User type declaration
      req.user = {
        username: username
      }
      //tell client about client-specific information in all future responses
      res.append('username',username)
      res.append('authenticated',true)
      return true;
    }
    //default information
    res.append('username','')
    res.append('authenticated',false)
    return false;
  }
  constructor(){
    var router = express.Router();

    /* (Middleware) Authentication. Checks for credentials in cookie or body.*/
    router.use(function(req, res, next) {
      RouteAuth.authorizeUser(req,res)
      next();
    });

    /* GET login page. */
    router.get('/auth/login', function(req, res, next) {
      if (!req.user)
        res.render('simplelogin', {
          title: 'log in'
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

    /* POST login. */
    router.post('/auth/login', function(req, res, next) {
      if (!req.body.username || !req.body.password) //incorrect POST body
        res.send({success: false, msg: 'Provide username and password'});
      else {
        if (RouteAuth.authorizeUser(req,res)) {
          var user = {username:req.body.username,password:req.body.password};
          RouteAuth.setAuthenticationCookie(req,res,user);
          res.send({success: true, msg: 'Valid Credentials!'})
        } else {
          res.send({success: false, msg: 'Incorrect username or password!'})
        }
      }
    });

    /* POST logout (this just deletes the credentials cookie in the broswer). */
    router.post('/auth/logout', function(req, res, next) {
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
    router.post('/auth/register', function(req, res, next) {
      if (req.user)//user already registered:
        res.send({success: false,
          msg: 'Registration not necessary. Credentials already validated'})
      else if (!req.body.username || !req.body.password) //incorrect POST body
        res.send({success: false, msg: 'Provide username and password'});
      else {
        //register new user!
        var username_exists = false;//TODO(NaOH)
	if (username_exists) {
          res.send({success: false, msg: 'Username already exists!'})
          return;
        }
        //TODO(NaOH): create user in database
        var user=null;
	RouteAuth.setAuthenticationCookie(req,res,user);
        res.send({success: false, msg: 'Registration not yet implemented!'})
      }
    });
   
    this.router_ = router;
  }
  getRouter(){
    return this.router_;
  }
}

module.exports=RouteAuth
