/** Represents a Notification Manager */

///<reference path='../types/node/node.d.ts'/>
///<reference path='../types/express/express.d.ts'/> 
import DatabaseManager = require('./DatabaseManager');
import { User } from './User';
import { Notification } from './Notification';
import { EventSignal } from './EventSignal';
import { EventType } from './EventType';
var config = require('../config')
var nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport("SMTP",{
   service: "Gmail",  // sets automatically host, port and connection security settings
   auth: {
       user: config.email_user,
       pass: config.email_pass
   }
});
export class NotificationManager {
	
	dbmanager:DatabaseManager; /** Database Manager */
	

	/*  CONSTRUCTOR */
	/** Creates Notification manager */
	constructor(dbmanager:DatabaseManager){
	this.dbmanager = dbmanager;
	}
	
	/** Send Mail */
	sendMail(username:string, notification:Notification){
		if (config.email)
			this.dbmanager.getUser(username, function(err, user){	
				smtpTransport.sendMail({  //email options
		 				from: '"DropComix 👥" <dropcomixupdates@gmail.com>', 
					// sender address.  Must be the same as authenticated user if using GMail.
		 				to: user.getEmail(), // receiver
		 				subject: "DropComix", // subject
		 				text: notification.getMessage() // body
					}, function(error, response){  //callback
			 			if(error){
				   				console.log(error);
			 			}else{
				   			console.log("Message sent: " + response.message);
			 			}
		 		smtpTransport.close(); // shut down the connection pool, no more messages.  Comment this line out to continue sending emails.
				});
			});
	}
		
	/* Async subscribes user to a given event */
	/* callback:[](err, event_id) */
	subscribeEvent(event:EventSignal, username:string, callback:any){
		var db_manager:DatabaseManager=this.dbmanager;
		db_manager.insertSubscriber(event, username, callback);
	}
	

	/* Async subscribes viewer to a given comics comments */
	/* callback:[](err, event) */
	subscribeComments(comicpage_uri:string, username:string, callback:any){
		this.subscribeEvent(new EventSignal(EventType.New_Comment, comicpage_uri), username, callback);
	}
	/* Async subscribes viewer to a given comics comments */
	/* callback:[](err, event) */
	subscribeEditComments(comicpage_uri:string, username:string, callback:any){
		this.subscribeEvent(new EventSignal(EventType.New_Edit_Comment, comicpage_uri), username, callback);
	}		

	/* Async subscribes viewer to a given comic */
	/* callback:[](err, event) */
	subscribeComic(comic_uri:string, username:string, callback:any){
		this.subscribeEvent(new EventSignal(EventType.Comic_Publish, comic_uri), username, callback);
	}

	/* Async subscribes viewer to a given comic */
	/* callback:[](err, event) */
	subscribeComicEdit(comic_uri:string, username:string, callback:any){
		this.subscribeEvent(new EventSignal(EventType.Comic_Update, comic_uri), username, callback);	
	}

	//Async signals that an event has taken place
	//callback:[](err, event) */
	signalEvent(event:EventSignal, instance_data:string, callback:any){
		console.log("SIGNALING "); // TODO: See how to get event in string format
		var db_manager:DatabaseManager=this.dbmanager;
		var n_manager:NotificationManager=this;
		db_manager.getSubscribers(event, function(err,user_list){
			if (err||!user_list){
				console.log("No users subscribed to this event");
				callback(err, null);	
			}
			else {
				for (var i = 0; i < user_list.length; i++) { 
				    n_manager.notifyUser(user_list[i], event, instance_data, callback);
				}			
			} 
		}); 
	}

	/* Async creates a notification item for a User */
	// callback:[](err, event)
	notifyUser(username:string, event:EventSignal, instance_data:string, callback){
		console.log("Notifying " + username);
		var db_manager:DatabaseManager = this.dbmanager;
		var notification:Notification = new Notification(event, instance_data); // TODO: Properly id comic
		this.sendMail(username, notification);
		db_manager.insertNotification(username, notification, function(err, notification){
			if (notification) return callback(null, notification);
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
			var notifications:Notification[] = u.getNotifications();
			return callback(null, notifications);			
		});
	} 
	
	// Async signals that a comic has been published
	signalPublish(comic_uri:string, callback:any){
		this.signalEvent(new EventSignal(EventType.Comic_Publish, comic_uri),"Comic has been published!", callback);	
	}
	// Async signals that a comic has been published
	signalUpdate(comic_uri:string, callback:any){
		this.signalEvent(new EventSignal(EventType.Comic_Update, comic_uri),"Comic has been updated!", callback);	
	}
	signalNewComment(comicpage_uri:string, callback:any){
		this.signalEvent(new EventSignal(EventType.New_Comment, comicpage_uri),"Comic has been commented on!", callback);	
	}
	signalNewEditComment(comicpage_uri:string, callback:any){
		this.signalEvent(new EventSignal(EventType.New_Edit_Comment, comicpage_uri),"Comic has been commented on!", callback);	
	}
	
}
