/** Represents a comic */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/> 
import DatabaseManager = require('./DatabaseManager');
import { Page } from './Page';

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
	pages:Page[]; /** Pages in the comic.*/
	draftpages:Page[] /** Draft pages; only visible from edit screen*/
	image_collection:string;//! TODO: this is sketchy. Use mongodb's hierarchy system
	panel_map:string[]; /**maps from panel-id to path to image*/
	manager:DatabaseManager; /** Database Manager */
	tags:string[];
	public_view:string;
	cover:string; //path to coverpage
	panel_preview:string;
	requestlist:string[]; /** A list of all users requesting to view the comic */

	/*  CONSTRUCTOR */
	/** Looks up Comic from database by name */
	constructor(uri_sanitized: string, creator: string, description: string, public_view: string){
		this.uri_sanitized = uri_sanitized;
		this.creator = creator;
		this.description = description;
		this.image_collection = creator + '_' + uri_sanitized;
		this.viewlist = [];
		this.editlist = [];
		this.pages = [];
		this.tags = [];
		this.pages.push(new Page());
		this.draftpages = [];
		this.draftpages.push(new Page());
		this.panel_map=[];
		this.public_view=public_view;
		this.requestlist = [];

	} /** stub */
	
	/* GETTERS */
	getName():string {
		return this.name;
	}
	getURI():string {
		return this.uri;
	}
	getCreator():string {
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
	getPages():Page[] {
		return this.pages;
	}
	getPage(id: number):Page{
    	if (id<1)
    		throw new Error("page id " + id + " invalid; id starts from 1");
		return this.pages[id-1];
	}
	getDraftPages():Page[] {
		return this.draftpages;
	}
	getDraftPage(id: number):Page{
    	if (id<1)
    		throw new Error("page id " + id + " invalid; id starts from 1");
		return this.draftpages[id-1];
	}
	getManager():DatabaseManager {
		return this.manager;
	}
	getImageCollection(): string{
		return this.image_collection
	}
	getPanelPath(panel:number){
		return this.panel_map[panel];
	}

	getPublicView(): string{
		return this.public_view;
	}

	getCover(): string{
		return this.cover;
	}

	getRequestlist() {
		return this.requestlist;
	}

	getPanelPreview():string {
		return this.panel_preview;
	}

	/* PREDICATES */

	getUserCanRequest(username:string) {
		if (this.requestlist.indexOf(username)!=-1)
			return true;
		return this.getUserCanView(username);
	}

	getUserCanView(username: string) {
		if (this.viewlist.indexOf(username)!=-1)
			return true;
		return this.getUserCanEdit(username);
	}

	getUserCanEdit(username: string) {
		if (this.editlist.indexOf(username)!=-1)
			return true;
		return this.getUserCanAdmin(username);
	}

	getUserCanAdmin(username: string) {
		if (this.adminlist.indexOf(username)!=-1)
			return true;
		return false;
	}
	
	/* STATIC METHODS */

	/*sanitizes a name into a URI.
		- Idempotent: multiple calls to sanitize will not have any additional affect*/
  static sanitizeName(name: string): string{
		return name
						.replace(/[ _*&\^@\/\\]+/g,'-') //swap space-like characters for dash
						.replace(/[^a-zA-Z0-9\-]/g,'') //remove bad characters
						.replace(/\-+/g,'-') //condense multiple dashes into one.
  }

	/* takes a comic URI and converts it into its canonical version*/
  static canonicalURI(uri: string): string {
		return Comic.sanitizeName(uri).toLowerCase();
  }
}

