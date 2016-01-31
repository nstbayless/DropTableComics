///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 

/** Represents a manager of the database, through which Users and Comics access the database*/
import User = require('./User');
import { Comic } from './Comic';
var bcrypt = require('bcrypt');

class DatabaseManager {

  //mongo database
  private db: any

  constructor(db: any) {
    this.db=db;
  }

  //creates a new Artist and adds it to the database
  createArtist(username: string, password: string, email: string): User.Artist {
    var hash = this.computeHash(password);
    var artist = new User.Artist(username);
    artist.hash=hash;
    artist.email=email;
    var users = this.db.get('users');
    console.log("creating artist")
    users.insert({username:username,hash:hash,type:"artist",email:email});
    return artist;
  }
  
   //creates a new comic and adds it to the database
  createComic(name: string, artist: string): Comic {
    var comic = new Comic(name);
	var viewlist = new Array<string>();
	var adminlist = new Array<string>();
	var editlist = new Array<string>();
	editlist[0] = artist;
	adminlist[0] = artist;
    var comics = this.db.get('comics');
    console.log("creating comic")
    comics.insert({name:name,viewlist:viewlist,editlist:editlist,adminlist:adminlist});
    return comic;
  }

  //creates a new Viewer and adds it to the database
  createViewer(username: string, password: string, email: string): User.Viewer {
    var hash = this.computeHash(password);
    var viewer = new User.Viewer(username);
    viewer.hash=hash;
    viewer.email=email;
    var users = this.db.get('users');
    users.insert({username:username,hash:hash,type:"pleb",email:email});
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
        user = new User.Artist(user_canon.username);
      else if (user_canon.type=="pleb")
        user = new User.Viewer(user_canon.username);
      else
        throw new Error("Corrupted database: user.type == '" + user_canon.type + "'")
      //fill user fields based on canononical version of user...
      user.hash=user_canon.hash;
      user.email=user_canon.email;
      callback(null,user);
    });
  }

  //creates a hash for the given password
  computeHash(password: string): string {
    return bcrypt.hashSync(password,bcrypt.genSaltSync(3));
  }

  //returns true if the given password matches the given hash
  checkHash(password: string, hash: string): boolean{
    return bcrypt.compareSync(password,hash);
  }
}

export=DatabaseManager
