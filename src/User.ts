///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 

var DBManager = require("DatabaseManager")

/** Represents a user of DropComix */
export interface User {

    username: string;
    hash: string;
    getHash(): string;
}

/** Represents a viewer of DropComix */
export class Viewer implements User {

    username: string;
    hash: string;
    constructor(username: string, hash: string) {
      this.hash=hash;
      this.username=username;
    }
    getHash():string{
      return this.hash;
    }
    
}
/** Represents a viewer of DropComix */
export class Artist implements User {

    username: string;
    hash: string;
    constructor(username: string, hash: string) {
      this.hash=hash;
      this.username=username;
    }
    getHash():string{
      return this.hash;
    }
}
