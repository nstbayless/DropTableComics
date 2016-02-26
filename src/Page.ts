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
	
	/** CONSTRUCTOR */
	constructor(){
		this.panels=[];
	}
	 
	/** GETTERS */
	getPanels(): Panel[]{
		return this.panels;
	}
	
}
