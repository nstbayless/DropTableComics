///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 

/** Represents a manager of the database, through which Users and Comics access the database*/

import User = require('User')

class DatabaseManager {

  //mongo database
  private db: any

  constructor(db: any) {
    this.db=db;
  }

  //creates a new Artist and adds it to the database
  createArtist(username: string, password: string): User.Artist {
    var artist = new User.Artist(username,this.computeHash(password));
    return artist;
  }

  //creates a new Viewer and adds it to the database
  createViewer(username: string, password: string): User.Viewer {
    var viewer = new User.Viewer(username,this.computeHash(password));
    return viewer;
  }

  //retrieves the given user from the database
  getUser(username: string) {
    var viewer = new User.Viewer(username,"");
    return viewer;
  }

  //creates a hash for the given password
  computeHash(password: string): string {
    //TODO(NaOH): encrypt passwords
    return password;
  }

  //returns true if the given password matches the hash stored in the database
  checkPassword(username: string, password: string): boolean{
    var user = this.getUser(username);
    if (!user)
      throw new Error("User does not exist ("+username+")")
    //TODO(NaOH): encrypt passwords
    if (password==user.getHash())
      return true;
    return false;
  }
}

export=DatabaseManager
