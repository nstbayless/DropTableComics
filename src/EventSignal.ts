/** Represents an Event */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/>

import { EventType } from './EventType';
//TODO: implement
export class EventSignal {

	id:string;		// is comic-uri if event type is a comic-related
	et:EventType;

	/*  CONSTRUCTOR */
	/** Creates EventSignal */
	constructor(et:any, id:string){
		this.et = et;
		this.id = id;
	}

};
