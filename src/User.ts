///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 

import DatabaseManager = require("./DatabaseManager")

/** Represents a user of DropComix */
 
export interface User {

    username: string; /** The username of the user */
    hash: string;  /** the hash of the user's password */
    email: string; /** the email address of the user */
    description: string; /** A description associated with the user */
    manager:DatabaseManager; /** Database Manager */
    viewlist:string[]; /** A list of all viewable comics */	
	
    /** GETTERS */
    getUsername():string;
    getHash(): string;
    getViewlist():string[];
    getManager():DatabaseManager;
    getDescription():string;
    getEmail(): string;
}

/** Represents a viewer of DropComix */
export class Viewer implements User {

    username: string; /** The username of the artist */
    hash: string;
    email: string; /** the email address of the user */
    description: string; /** A description associated with the artist */
    manager:DatabaseManager; /** Database Manager */
    viewlist:string[]; /** A list of all viewable comics */
	
    /** CONSTRUCTOR */
    constructor(username: string){} /** stub */
	
    /** GETTERS */
    getUsername():string{
		return this.username;
	}
	
	getViewlist():string[] {
		return this.viewlist;
	}
	getManager():DatabaseManager {
		return this.manager;
	}
	getDescription():string {
		return this.description;
	}
    getHash(): string {
      return this.hash;
    }
    getEmail(): string {
      return this.email;
    }	
}

/** Represents an artist on DropComix */
export class Artist implements User {
	username: string; /** The username of the artist */
    hash: string;
    email: string; /** the email address of the user */
	description: string; /** A description associated with the artist */
	manager:DatabaseManager; /** Database Manager */
	viewlist:string[]; /** A list of all viewable comics */
	editlist:string[]; /** A list of all editable comics */
	adminlist:string[]; /** A list of all adminstrated comics */
		/* INVARIANT:  A comic is on at most one list */
		
		
	/** CONSTRUCTOR */
		/** Looks up Artist from database by name */
	 constructor(username: string){} /** stub */
	
		/** GETTERS */
	getUsername():string{
		return this.username;
	}
	
	getViewlist():string[] {
		return this.viewlist;
	}
	getEditlist():string[] {
		return this.viewlist;
	}
	getAdminlist():string[] {
		return this.viewlist;
	}
	getManager():DatabaseManager {
		return this.manager;
	}
	getDescription():string {
		return this.description;
	}
    getHash(): string {
      return this.hash;
    }	
    getEmail(): string {
      return this.email;
    }			

}
