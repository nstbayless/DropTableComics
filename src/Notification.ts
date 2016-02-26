/** Represents a Notification */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/>
 
import { Comic } from './Comic';
import { User } from './User';
import { EventSignal } from './EventSignal';
//TODO: implement
export class Notification {
	
	date:Date; /** a time in milliseconds according to UCT */
	m:string; /** message */
	event:EventSignal; /** The event that occurred */
	/** CONSTRUCTOR */ 
	/** creates a notification object */
	 constructor(event:EventSignal, message:string){
		this.date = new Date();
		this.event = event;
		this.m = message;
	}
	 
	/** GETTERS */
	getDate():Date{
		return this.date;
	}

	getMessage():string {
		return this.m;
	}

	
	
	
}
