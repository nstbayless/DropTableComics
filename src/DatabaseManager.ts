///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 

/** Represents a manager of the database, through which Users and Comics access the database*/

import User = require('./User')

class DatabaseManager {

  //mongo database
  private db: any

  constructor(db: any) {
    this.db=db;
  }

  //creates a new Artist and adds it to the database
  createArtist(username: string, password: string): User.Artist {
    var hash = this.computeHash(password);
    var artist = new User.Artist(username,hash);
    var users = this.db.get('users');
    console.log("creating artist")
    users.insert({username:username,hash:hash,type:"artist"});    
    return artist;
  }

  //creates a new Viewer and adds it to the database
  createViewer(username: string, password: string): User.Viewer {
    var hash = this.computeHash(password);
    var viewer = new User.Viewer(username,hash);
    var users = this.db.get('users');
    users.insert({username:username,hash:hash,type:"pleb"});    
    return viewer;
  }

  //asynchronously retrieves the given user from the database
  // callback: [](err,user)
  getUser(username: string, callback:any) {
    var users = this.db.get('users');
    users.findOne({username:username}, function(err,user_canon){
      if (err||!user_canon) return callback(err,null);
      var user: User.User;
      if (user_canon.type=="artist")
        user = new User.Artist(user_canon.username,user_canon.hash);
      else if (user_canon.type=="pleb")
        user = new User.Viewer(user_canon.username,user_canon.hash);
      else
        throw new Error("Corrupted database: user.type == '" + user_canon.type + "'")
      //fill user fields based on canononical version of user...
      callback(null,user);
    });
  }

  //creates a hash for the given password
  computeHash(password: string): string {
    //TODO(NaOH): encrypt passwords
    return password;
  }

  //returns true if the given password matches the given hash
  checkHash(password: string, hash: string): boolean{
    return password == hash;
  }
}

export=DatabaseManager
