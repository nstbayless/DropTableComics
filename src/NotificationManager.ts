/** Represents a Notification Manager */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/> 
import DatabaseManager = require('./DatabaseManager');
import { User } from './User';

export class NotificationManager {
	/** REQUIRES event_id = <event-type>_<type-specific-id>
		E.g new_collaborator_NaOH/MyComic
	
	*/
	dbmanager:DatabaseManager; /** Database Manager */
	

	/*  CONSTRUCTOR */
	/** Creates Notification manager */
	constructor(dbmanager:DatabaseManager){
	this.dbmanager = dbmanager;
	}
	
		
	/* Async subscribes user to a given event */
	/* callback:[](err, event_id) */
	subscribeEvent(event_id:string, username:string, callback:any){
		var db_manager:DatabaseManager=this.dbmanager;
		db_manager.insertSubscriber(event_id, username, callback);
	}
	/* Async subscribes user to a given comic */
	/* callback:[](err, event_id) */
	subscribeComic(comic_uri:string, username:string, callback:any){
		this.subscribeEvent("comic-published_" + comic_uri, username, callback);	
	}

	//Async signals that an event has taken place
	//callback:[](err, event_id) */
	signalEvent(event_id:string, instance_data:string, callback:any){
		console.log("SIGNALING " + event_id);
		var db_manager:DatabaseManager=this.dbmanager;
		var n_manager:NotificationManager=this;

		db_manager.getSubscribers(event_id, function(err,user_list){
			if (err||!user_list){
				console.log("No users subscribed to this event");
				callback(err, null);	
			}
			else {
				for (var i = 0; i < user_list.length; i++) { 
				    n_manager.notifyUser(user_list[i], event_id, instance_data, callback);
				}			
			} 
		}); 
	}

	/* Async creates a notification item for a User */
	// callback:[](err, event_id)
	notifyUser(username:string, event_id:string, instance_data:string, callback){
		console.log("Notifying " + username);
		var db_manager:DatabaseManager=this.dbmanager;
		var message:string = event_id + instance_data; // TODO: Parse event_id into user-friendly info
		db_manager.insertNotification(username, message, function(err, message){
			if (message) return callback(null, event_id);
		});
	}

	/* Async gets notifications for a User */
	// callback:[](err, notifications)	
	getNotifications(username:string, callback){
		var db_manager:DatabaseManager=this.dbmanager;
		db_manager.getUser(username, function(err, user){
			if (err||!user){
				console.log("Can't find user!");
				 return callback(err, null);}
			var u:User = user;
			console.log("Getting Notifications...");
			var notifications:string[] = u.getNotifications();
			return callback(null, notifications);			
		});
	} 
	
	// Async signals that a comic has been published
	signalPublish(comic_uri:string, callback:any){
		this.signalEvent("comic-published_" + comic_uri,"Comic has been updated!", callback);	
	}
	
}
