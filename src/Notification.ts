/** Represents a Notification */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/>
 
import { Comic } from './Comic';
import { User } from './User';
import { EventSignal } from './EventSignal';
//TODO: implement
export class Notification {
	
	timestamp:Date; /** a time in milliseconds according to UCT */
	msg:string; /** message */
	event:EventSignal; /** The event that occurred */
	/** CONSTRUCTOR */ 
	/** creates a notification object */
	 constructor(event:EventSignal, message:string){
		var date:Date = new Date();
		this.timestamp = date;
		this.event = event;
		this.msg = message;
	}
	 
	/** GETTERS */
	getTimestamp():Date{
		return this.timestamp;
	}

	getMessage():string {
		return this.msg;
	}
	

	
	
	
}
