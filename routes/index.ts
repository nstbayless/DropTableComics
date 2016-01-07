///<reference path='../types/node/node.d.ts'/>
  
///<reference path='../types/express/express.d.ts'/> 
  
var express = require('express');
var router = express.Router();

interface UserInterface {
  getName(): string;
  getEmail(): string;
}

class User {
  private name_:string;
  private email_:string;
  constructor(name: string, email: string){
    this.name_=name;
    this.email_=email;
  }  

  getName(): string {
    return this.name_
  }
  getEmail(): string {
    return this.email_
  }
}

class Router {
  constructor(){
    //nothing yet
  }
  start(){
    /* GET home page. */
    router.get('/', function(req, res, next) {
      res.render('index', { title: 'Express' });
    });
    
    /* GET Hello World page. */
    router.get('/helloworld', function(req, res) {
        res.render('helloworld', { title: 'Hello, World!' });
    });
    
    /* GET Userlist page. */
    router.get('/userlist', function(req, res) {
        var db = req.db;
        var collection = db.get('usercollection');
        collection.find({},{},function(e,docs){
            res.render('userlist', {
                "userlist" : docs
            });
        });
    });
    
    /* GET New User page. */
    router.get('/newuser', function(req, res) {
        res.render('newuser', { title: 'Add New User' });
    });
    
    /* POST to Add User Service */
    router.post('/adduser', function(req, res) {
    
        // Set our internal DB variable
        var db = req.db;
    
        // Get our form values. These rely on the "name" attributes
        var user = new User(req.body.username,req.body.useremail)
    
        // Set our collection
        var collection = db.get('usercollection');

        // Submit to the DB
        collection.insert({
            "username" : user.getName(),
            "email" : user.getEmail()
        }, function (err, doc) {
            if (err) {
                // If it failed, return error
                res.send("There was a problem adding the information to the database.");
            }
            else {
                // And forward to success page
                res.redirect("userlist");
            }
        });
    });
  
    module.exports = router;
  }
}

var router_ = new Router();
router_.start();
