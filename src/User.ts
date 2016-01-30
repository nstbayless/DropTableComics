/** Represents a user of DropComix */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/>
 
interface User {

    username: string; /** The username of the artist */
	description: string; /** A description associated with the artist */
	manager:DatabaseManager; /** Database Manager */
	viewlist:string[]; /** A list of all viewable comics */

	/** CONSTRUCTOR */
	
	
		/** GETTERS */
	getUsername():string;
	getViewlist():string[];
	getManager():DatabaseManager;
	getDescription():string;
	
}

/** Represents a viewer of DropComix */
class Viewer implements User {

    username: string; /** The username of the artist */
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
	
	 
}
/** Represents an artist on DropComix */
class Artist implements User {
	 
	username: string; /** The username of the artist */
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
			

}

module.exports = Viewer;
module.exports = Artist;


