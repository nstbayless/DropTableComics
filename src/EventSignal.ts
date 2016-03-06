/** Represents an Event */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/>

import { EventType } from './EventType';
//TODO: implement
export class EventSignal {

	id:string;		// is comic-uri if event type is a comic-related
	event_type:EventType;

	/*  CONSTRUCTOR */
	/** Creates EventSignal */
	constructor(event_type:any, id:string){
		this.event_type = event_type;
		this.id = id;
	}

};
