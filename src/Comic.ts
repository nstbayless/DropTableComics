/** Represents a comic */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/> 
import DatabaseManager = require('./DatabaseManager');

export class Comic {
	
  //!uri used when linking to the comic
	uri: string;
  //!used to look up comic in database (is unique)
  private uri_sanitized: string;
	name:string; /** name of comic */
	private creator:string; /** original creator of comic  < Cannot be changed > */
	description:string; /** description */ 
	viewlist:string[]; /** A list of all viewers of this comic */
	editlist:string[]; /** A list of all editors of this comic */
	adminlist:string[]; /** A list of all admins of this comic */ 
	/* INVARIANT:  A user is on at most one list */
	pages:number[][]; /** Pages in the comic. //TODO: page should be a class*/
	image_collection:string;//! TODO: this is sketchy. Use mongodb's hierarchy system
	panel_map:string[]; /**maps from panel-id to path to image*/
	manager:DatabaseManager; /** Database Manager */
	
	/*  CONSTRUCTOR */
	/** Looks up Comic from database by name */
	constructor(uri_sanitized: string, creator: string, description: string){
		this.uri_sanitized = uri_sanitized;
		this.creator = creator;
		this.description = description;
		this.image_collection = creator + '_' + uri_sanitized;
		this.pages=[]
		this.pages[0]=[];
		this.panel_map=[];
	} /** stub */
	
	/* GETTERS */
	getName():string {
		return this.name;
	}
	getURI():string {
		return this.uri;
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
	getPages():number[][] {
		return this.pages;
	}
	getPage(id: number){
    if (id<1)
      throw new Error("page id " + id + " invalid; id starts from 1");
		return this.pages[id-1];
  }
	getManager():any {
		return this.manager;
	}
	getImageCollection(): string{
		return this.image_collection
	}
	getPanelPath(panel:number){
		return this.panel_map[panel];
	}
	
	/* STATIC METHODS */

	/*sanitizes a name into a URI.
		- Idempotent: multiple calls to sanitize will not have any additional affect*/
  static sanitizeName(name: string): string{
		return name
						.replace(/[ _*&\^@\/\\]+/g,'-') //swap space-like characters for dash
						.replace(/[^a-zA-Z0-9\-]/,'') //remove bad characters
  }

	/* takes a comic URI and converts it into its canonical version*/
  static canonicalURI(uri: string): string {
		return Comic.sanitizeName(uri).toLowerCase();
  }
	
}

