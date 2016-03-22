/** Represents a page */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/> 

import { Comic } from './Comic';


/** Represents a panel in a comic*/
export class Panel {
	/** id of the panel for this comic,
	such that the following GET request returns the panel image data:
	GET /accounts/<account-name>/comics/<comic-name>/panels/<id>*/
	panelID: number;
}

export class Overlay {
	/** id of the panel for this comic, as in Panel above,
	such that the following GET request returns the panel image data:
	GET /accounts/<account-name>/comics/<comic-name>/panels/<id>*/
	panelID: number;
	x: number;
	y: number;
	construct_from_db(overlay_canon: any) {
		this.panelID=overlay_canon.panelID;
		this.x=overlay_canon.x;
		this.y=overlay_canon.y;
	}
}

export class Comment {
	adminlevel: number;
	username: string;
	postDate: string;
	description: string;

	getAdminLevel(): number{
		return this.adminlevel;
	}

	getUsername(): string{
		return this.username;
	}

	getPostDate(): string{
		return this.postDate;
	}

	getDescription(): string{
		return this.description;
	}
}

export class Page {	
	
	/** Ordered list of panels*/
	panels: Panel[];
	comments: Comment[];
	/* Ordered (by depth) list of overlay panels*/
	overlays: Overlay[];
	title: string;
	/** indicates page has been edited since last publishing*/
	edited: boolean;
	
	/** CONSTRUCTOR */
	constructor(){
		this.panels=[];
		this.comments = [];
		this.overlays = [];
		this.title="";
		this.edited=false;
	}
	
	//constructs from untyped info stored in db
	construct_from_db(page_canon: any): Page {
		this.panels=page_canon.panels;
		this.comments = page_canon.comments;		
		if (!page_canon.overlays)
			this.overlays = [];
		else for (var i=0;i<page_canon.overlays.length;i++) {
			var o: Overlay = new Overlay();
			o.construct_from_db(page_canon.overlays[i]);
			this.overlays.push(o);
		}
		this.title=page_canon.title;
		this.edited=(!!page_canon.edited);
		return this;
	}

	/** GETTERS */
	getPanels(): Panel[]{
		return this.panels;
	}

	getOverlays(): Overlay[]{
		return this.overlays;
	}

	getTitle(): string{
		return this.title;
	}

	getComments(): Comment[] {
		return this.comments;
	}
}
