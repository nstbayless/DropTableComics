///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 

import DatabaseManager = require("./DatabaseManager");
import { Notification } from './Notification';


/** Represents a user of DropComix */

export interface User {

username: string; /** The username of the user */
hash: string;  /** the hash of the user's password */
email: string; /** the email address of the user */
description: string; /** A description associated with the user */
manager:DatabaseManager; /** Database Manager */
viewlist:string[]; /** A list of all viewable comics */
notifications:Notification[]; /** A list of notification messages to display */	
type:string; /** type of the user, either "pleb" or "artist"*/
shouldShowSubscription: boolean; /** the sub. choice of the user */
avatar: string; /** path to avatar image */
name: string; /**user's real or preferred name*/
location: string;
timezone: string; //TODO: change to proper timezone object format, not arbitrary string
link: string;
	
	/** GETTERS */
	getUsername():string;
	getHash(): string;
	getViewlist():string[];
	getNotifications():Notification[];
	getManager():DatabaseManager;
	getDescription():string;
	getEmail(): string;
	getType(): string;
	isArtist(): boolean;
	subscriptionChoice(): boolean;
	getAvatar(): string;
	getName(): string;
	getLocation(): string;
	getTimeZone(): string;
	getLink(): string;
}

/** Represents a viewer of DropComix */
export class Viewer implements User {

username: string; /** The username of the artist */
hash: string;
email: string; /** the email address of the user */
description: string; /** A description associated with the artist */
manager:DatabaseManager; /** Database Manager */
viewlist:string[]; /** A list of all viewable comics */
notifications:Notification[]; /** A list of notification messages to display */
type:string; /** type of the user, either "pleb" or "artist"*/
shouldShowSubscription: boolean; 
avatar: string;
name: string;
location: string;
timezone: string;
link: string;

	/** CONSTRUCTOR */
	/** Not to be called outside DBManager */
	constructor(username: string){
		this.username = username;
		this.type = "pleb";
	}
	
	/** GETTERS */
	getUsername():string{
		return this.username;
	}
	
	getViewlist():string[] {
		return this.viewlist;
	}
	getManager():DatabaseManager {
		return this.manager;
	}
	getDescription():string {
		return this.description;
	}
	getHash(): string {
		return this.hash;
	}
	getEmail(): string {
		return this.email;
	}
	getType(): string{
		return this.type;
	}
	isArtist(): boolean{
		return false; 
	}
	getNotifications():Notification[]{
		return this.notifications;
	}
	subscriptionChoice(): boolean{
		return this.shouldShowSubscription;
	}
	getAvatar(): string{
		return this.avatar;
	}
	getName(): string{
		return this.name;
	}
	getLocation(): string{
		return this.location;
	}
	getTimeZone(): string{
		return this.timezone;
	}
	getLink(): string{
		return this.link; 
	}
}

/** Represents an artist on DropComix */
export class Artist implements User {
username: string; /** The username of the artist */
hash: string;
email: string; /** the email address of the user */
description: string; /** A description associated with the artist */
manager:DatabaseManager; /** Database Manager */
type:string; /** type of the user, either "pleb" or "artist"*/
viewlist:string[]; /** A list of all viewable comics */
editlist:string[]; /** A list of all editable comics */
adminlist:string[]; /** A list of all adminstrated comics */
	/* INVARIANT:  A comic is on at most one list */
notifications:Notification[]; /** A list of notification messages to display */	
shouldShowSubscription: boolean;
avatar: string;
name: string;
location: string;
timezone: string;
link: string; 

	/** CONSTRUCTOR */
	/** Initializes Artist username */
	/** Not to be called outside DBManager */
	constructor(username: string){
		this.username = username;
		this.type = "artist";
	} /** stub */
	
	/** GETTERS */
	getUsername():string{
		return this.username;
		
	}
	
	getViewlist():string[] {
		return this.viewlist;
	}
	getEditlist():string[] {
		return this.viewlist;
	}
	getAdminlist():string[] {
		return this.viewlist;
	}
	getManager():DatabaseManager {
		return this.manager;
	}
	getDescription():string {
		return this.description;
	}
	getHash(): string {
		return this.hash;
	}	
	getEmail(): string {
		return this.email;
	}
	getType(): string{
		return this.type;
	}
	isArtist(): boolean{
		return true;
	}
	getNotifications():Notification[]{
		return this.notifications;
	}
	subscriptionChoice(): boolean {
		return this.shouldShowSubscription;
	}
	getAvatar(): string {
		return this.avatar;
	}
	getName(): string {
		return this.name;
	}
	getLocation(): string {
		return this.location;
	}
	getTimeZone(): string {
		return this.timezone;
	}
	getLink(): string {
		return this.link;
	}s
}
