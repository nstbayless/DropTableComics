/** Represents a comic */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/> 
var manager = require("./DatabaseManager");

export class Comic {
	
	 name:string; /** Unique name of comic */
	 private creator:string; /** original creator of comic  < Cannot be changed > */
	 description:string; /** description */ 
	 viewlist:string[]; /** A list of all viewers of this comic */
	 editlist:string[]; /** A list of all editors of this comic */
	 adminlist:string[]; /** A list of all admins of this comic */ 
	/* INVARIANT:  A user is on at most one list */
	 pages:number[] /** Pages in the comic */
	 manager:any; /** Database Manager */
	
	/** CONSTRUCTOR */
	
	/** Looks up Comic from database by name */
	 constructor(name: string, creator: string, description: string){
		 this.name = name;
		 this.creator = creator;
		 this.description = description;
	 } /** stub */
	
	/** GETTERS */
	getName():string{
		return this.name;
	}
	getCreator():string{
		return this.creator;
	}
	getDescription():string{
		return this.description;
	}
	getViewlist():string[] {
		return this.viewlist;
	}
	getEditlist():string[] {
		return this.editlist;
	}
	getAdminlist():string[] {
		return this.adminlist;
	}
	getPages():number[] {
		return this.pages;
	}
	getManager():any {
		return this.manager;
	}
	
	
	
}

