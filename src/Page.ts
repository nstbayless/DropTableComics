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

export class Page {	
	
	/** Ordered list of panels*/
	panels: Panel[];
	title: string;
	/** indicates page has been edited since last publishing*/
	edited: boolean;
	
	/** CONSTRUCTOR */
	constructor(){
		this.panels=[];
		this.title="";
		this.edited=false;
	}
	
	//constructs from untyped info stored in db
	construct_from_db(page_canon: any): Page {
		this.panels=page_canon.panels;
		this.title=page_canon.title;
		this.edited=(!!page_canon.edited);
		return this;
	}

	/** GETTERS */
	getPanels(): Panel[]{
		return this.panels;
	}

	getTitle(): string{
		return this.title;
	}
}
