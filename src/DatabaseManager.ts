///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 

/** Represents a manager of the database, through which Users and Comics access the database*/
import { User, Viewer, Artist } from './User';
import { Comic } from './Comic';
import { Page } from './Page';
import { Notification } from './Notification';
import { EventSignal } from './EventSignal';
var bcrypt = require('bcrypt');

class DatabaseManager {

	// mongo database
	private db: any

	constructor(db: any) {
		this.db=db;
	}

	// creates a new Artist and adds it to the database
	createArtist(username: string, password: string, email: string): Artist {
		var hash = this.computeHash(password);
		var artist: Artist = new Artist(username);
		artist.hash=hash;
		artist.email=email;
		var notifications = new Array<Notification>();
		console.log(notifications.length);
		var users = this.db.get('users');
		console.log("creating artist")
		users.insert({username:username,hash:hash,type:"artist",email:email, "notifications":notifications, 
			"avatar":"",
			"name": "",
			"description": "",
			"location": "",
			"timezone": "",
			"link": "",
			"subscription": "show"
	});
		return artist;
	}

	// creates a new Viewer and adds it to the database
	createViewer(username: string, password: string, email: string): Viewer {
		var hash = this.computeHash(password);
		var viewer = new Viewer(username);
		viewer.hash=hash;
		viewer.email=email;
		var notifications = new Array<Notification>();
		console.log(notifications.length);
		var users = this.db.get('users');
		users.insert({username:username,hash:hash,type:"pleb",email:email, "notifications":notifications, "avatar":""});
		return viewer;
	}

	// asynchronously retrieves the given user from the database
	// callback: [](err,user)
	getUser(username: string, callback:any) {
		var users = this.db.get('users');
		users.findOne({username:username}, function(err,user_canon){
			if (err||!user_canon) return callback(err,null);
			var user: User;
			if (user_canon.type=="artist")
			user = new Artist(user_canon.username);
			else if (user_canon.type=="pleb")
			user = new Viewer(user_canon.username);
			else
				throw new Error("Corrupted database: user.type == '" + user_canon.type + "'")
			//fill user fields based on canononical version of user...
			user.hash=user_canon.hash;
			user.email=user_canon.email;
			user.notifications=user_canon.notifications;
			user.subscription = user_canon.subscription;
			user.avatar = user_canon.avatar;
			user.name = user_canon.name;
			user.description = user_canon.description;
			user.location = user_canon.location;
			user.timezone = user_canon.timezone;
			user.link = user_canon.link;
			callback(null,user);
		});
	}

	// creates a new comic and adds it to the database
	createComic(name: string, artist: string, description:string): Comic {
		var uri = Comic.sanitizeName(name);
		var uri_sanitized = Comic.canonicalURI(uri)
		var comic = new Comic(uri_sanitized, artist, description);
		comic.name=name;
		comic.uri=uri;
		var viewlist = new Array<string>();
		var adminlist = new Array<string>();
		var editlist = new Array<string>();
		editlist[0] = artist;
		adminlist[0] = artist;
		var comics = this.db.get('comics');
		console.log("creating comic");
		comics.insert({"uri": uri, "urisan": uri_sanitized,
									"title":name,"viewlist":viewlist,
									"editlist":editlist,"adminlist":adminlist,"creator":artist,
									"description":description,
									"image_collection":comic.getImageCollection(),
									"panel_map":comic.panel_map,
									"pages": comic.pages,
									"drafts": comic.draftpages});
		return comic;
	}

	
	// creates a new subscription to an event by adding it to the database (should only be used internally)
	createSubscription(event:EventSignal, username: string) {
		console.log("creating event subscription");
    		var user_list = new Array<string>();
		var subscriptions = this.db.get('subscriptions');
		user_list.push(username);
		subscriptions.insert({"event":event, "user_list":user_list});
		return;
	}
	// async inserts a Subscriber (method to call from outside)
	// callback: [](err, event_id)
	insertSubscriber(event:EventSignal, username:string, callback:any){
		var dbmanager:DatabaseManager = this;
		var user_list = new Array<string>();
		var subscriptions = this.db.get('subscriptions');
		subscriptions.findOne({"event_id":event}, function(err, subscription){
			if (err || !subscription){
				console.log("Could not find event");
				dbmanager.createSubscription(event, username);
				return callback(null, event);			
			}
		console.log("found event");
		var user_list = subscription.user_list;
		user_list.push(username);
		return callback(null, event);
		});
	}

	// asynchronously retrieves the subscribers for an event from the database
	// callback: [](err,subscribers)
	getSubscribers(event: EventSignal, callback:any) {
		var subscriptions = this.db.get('subscriptions');
		subscriptions.findOne({"event":event}, function(err,event){
			if (err||!event) return callback(err,null);
			var user_list: string[] = event.user_list;
			callback(null,user_list);
		});
	}

	// async inserts a Notification message into a user
	// callback: [](err, message)
	insertNotification(username:string, notification:Notification, callback:any){
		var users = this.db.get('users');
		this.getUser(username, function(err, user) {
			var notifications:Notification[] = user.getNotifications();
			notifications.push(notification);	
				users.update(
	   				{ username: username },
	   				{$set: {"notifications": notifications}}
				);
		});
		console.log("Pushed notification");
		callback(null, notification);
	}

	// asynchronously retrieves the given comic from the database
	// callback: [](err,comic)
	getComic(username:string, comic_uri: string, callback:any) {
		comic_uri = Comic.canonicalURI(comic_uri);
		var comics = this.db.get('comics');
		comics.findOne({"urisan":comic_uri, creator:username}, function(err,comic_canon){
			if (err||!comic_canon){ 
				console.log("comic not found: " + username+"/comics/" + comic_uri);
				return callback(err,null); 
			}
			var comic: Comic;
			comic = new Comic(comic_uri, username, "");
			comic.uri=comic_canon.uri;
			comic.name=comic_canon.title;
			comic.viewlist = comic_canon.viewlist;
			comic.editlist = comic_canon.editlist;
			comic.adminlist = comic_canon.adminlist;
			comic.pages = [];
			for (var i=0;i<comic_canon.pages.length;i++) {
				comic.pages[i]=(new Page().construct_from_db(comic_canon.pages[i]));
			}
			comic.draftpages = [];
			var drafts_src = comic_canon.drafts;
			if (!comic_canon.drafts) //old db; no drafts
				drafts_src = comic_canon.pages;
			for (var i=0;i<drafts_src.length;i++) {
				comic.draftpages[i]=(new Page().construct_from_db(drafts_src[i]));
			}
			comic.panel_map=comic_canon.panel_map;
			comic.description = comic_canon.description;
			callback(null,comic);
		});
	}

	// asynchronously inserts the user into the viewlist
	// callback: [](err, viewlist)
	postViewlist(username: string, comic_uri: string, user:string, callback: any) {
		//TODO(Edward): enforce invariant: user only on one list.
		var db = this.db;
		comic_uri = Comic.canonicalURI(comic_uri);
		if (user.length < 3) {
			callback(new Error("user must be at least 3 letters long"), null);
		} else {
			this.getComic(username, comic_uri, function(err, comic) {
				if (comic && !err) {
					console.log("got the comic and now am putting into viewlist")
					var viewlist = comic.viewlist;
					var comics = db.get('comics');
					console.log(viewlist[0]);
					console.log(viewlist.indexOf(user) != -1);
					if (viewlist.indexOf(user) === -1) { //TODO: IS "===" LEGIT, OR SHOULD IT BE "=="?
						viewlist.push(user);
						console.log("Pushed viewer into viewlist")
						comics.update({
							"urisan": comic_uri,
							"creator": username
						},
						{
							$set: {
								"viewlist": viewlist,
							}
						});
						callback(err, viewlist);
					} else {
						console.log('USER WAS FOUND IN VIEWLIST')
						callback(err, null);
					}
				} else if (!comic || err) {
					console.log("ARE YOU GOING THROUGH THIS 2?")
					callback(err, null);
				}
			})
		}
	}

	// asynchronously inserts the user into the editlist
	// callback: [](err, editlist)
	postEditlist(username: string, comic_uri: string, user: string, callback: any) {
		var db = this.db;
		comic_uri = Comic.canonicalURI(comic_uri);
		// This was working code for inputting comic into users editlist
	// 	this.getUser(user, function(err, artist) {
	// 		var userEditlist = artist.editlist;
	// 		var users = db.get('users');
	// 		if (userEditlist.indexOf(comic_uri) != -1) {
	// 			console.log('USERS EDITLIST IS BEING UPDATED');
	// 			userEditlist.push(comic_uri);
	// 			console.log("Pushed comic into user's editlist");
	// 			users.update({ "username": user },
	// 				{ $set: { "editlist": userEditlist, } }
	// 			});
	// });
		if (user.length < 3) {
			console.log("ARE YOU GOING THROUGH THIS 1?")
			callback(new Error("user must be at least 3 letters long"), null);
		} else {
			this.getComic(username, comic_uri, function(err, comic) {
				if (comic && !err) {
					console.log("got the comic and now am putting into editlist")
					var editlist = comic.editlist;
					console.log(editlist[1]);
					console.log(editlist.indexOf(user) === -1);
					var comics = db.get('comics');
					if (editlist.indexOf(user) === -1) {
						console.log('USER WAS NOT IN EDITLIST');
						editlist.push(user);
						console.log("Pushed editor into editlist")
						comics.update({
							"urisan": comic_uri,
							"creator": username
						},
							{
								$set: {
									"editlist": editlist,
								}
							}); callback(err, editlist);
					} else {
						console.log('USER WAS FOUND IN EDITLIST')
						callback(err, null);
					}
				} else if (!comic || err) {
					console.log("ARE YOU GOING THROUGH THIS 2?")
					callback(err, null);
				}
			})
		}
	}

	//!!!!!!!!!!!! possible deprecation
	//checks permission if user has editing rights to the comic
	//callback: [](err, bool)
	checkEditPermission(username:string, creator:string, comic_uri:string, callback:any) {
	//NaOH suggests this method should be deprecated, use comic.getUserCanEdit() instead
		console.log("starting permission check");
		this.getComic(creator, comic_uri, function(err,comic) {
			if (comic && !err) {
				console.log("checking comic editlist for permissions...")
				// checks to see if given username is in the editlist
				if (comic.getEditlist().indexOf(username) != -1) {
					return callback(null, true);
				}
				if (comic.getAdminlist().indexOf(username) != -1) {
					return callback(null, true);
				}
				callback(err,false);
			} else {
				callback(err, null);
			}
		})
	}

	//!!!!!!!!!!!! possible deprecation
	//checks permission if user has editing rights to the comic
	//callback: [](err, bool)
	checkViewPermission(username: string, creator: string, comic_uri: string, callback: any) {
		//NaOH suggests this method should be deprecated, use comic.getUserCanView() instead
		var db = this.db;
		console.log("starting permission check");
		this.getComic(creator, comic_uri, function(err, comic) {
			if (comic && !err) {
				console.log("checking comic viewlist for permissions...")
				var viewlist = comic.viewlist;
				var editlist = comic.editlist;
				// checks to see if given username is in the editlist
				if (viewlist.indexOf(username) != -1 || editlist.indexOf(username) != -1); {
					callback(err, true);
				} 
			} else {
				console.log("returning false for permission check")
				callback(err, null);
			}
		})
	}

	//Returns all comics created by a user with given name asynchronously 
	// callback: [](err, comics)

	getComics(username:string, callback: any){
		var comics = this.db.get('comics');
		comics.find({ creator: username }, {}, callback);
	}
	
	/**Asynchronously adds a new page to the given comic.
	   callback: [](err, new_page_id)
		 - if no error occurred, err field is null
	   - otherwise, new_page_id is the id of the new page*/
	postPage(username:string, comic_uri: string, callback: any) {
		var db=this.db;
		comic_uri = Comic.canonicalURI(comic_uri);
		this.getComic(username,comic_uri,function(err,comic){
			try {
				if (comic&&!err) {
					var pages=comic.pages;
					pages.push(new Page());
					comic.draftpages.push(new Page());
					var new_page_id=pages.length;
					var comics = db.get('comics');
					comics.update({
						"urisan":comic_uri,
						"creator":username
					},
					{
						$set: {
							"pages":pages,
							"drafts":comic.draftpages
						}
					})
					callback(null,new_page_id);
	      }
			} catch (err) {
				callback(err,null);
			}
		})
	}

/**Asynchronously deletes the given page from the given comic.
	   callback: [](err)
		 - if no error occurred, err field is null*/
	deletePage(username:string, comic_uri: string, page: number, callback: any) {
		var db=this.db;
		comic_uri = Comic.canonicalURI(comic_uri);
		this.getComic(username,comic_uri,function(err,comic){
			try {
				if (comic&&!err) {
					var pages=comic.pages;
					if (page==1 && pages.length==1)
						throw new Error("Cannot remove only page from comic!");
					pages.splice(page-1,1);
					comic.draftpages.splice(page-1,1);
					var comics = db.get('comics');
					comics.update({
						"urisan":comic_uri,
						"creator":username
					},
					{
						$set: {
							"pages":pages,
							"drafts":comic.draftpages
						}
					})
					callback(null);
	      }
			} catch (err) {
				callback(err);
			}
		})
	}
	
	/**Asynchronously publishes the given draft page in the comic.
	   callback: [](err)
		 - if no error occurred, err field is null*/
	publishPage(username:string, comic_uri: string, page: number, callback: any) {
		var db=this.db;
		comic_uri = Comic.canonicalURI(comic_uri);
		this.getComic(username,comic_uri,function(err,comic){
			try {
				if (comic&&!err) {
					if (page<1)
						throw new Error("page id must be at least 1");
					comic.draftpages[page-1].edited=false;
					comic.pages[page-1]=comic.draftpages[page-1];
					var comics = db.get('comics');
					comics.update({
						"urisan":comic_uri,
						"creator":username
					},
					{
						$set: {
							"pages":comic.pages,
							"drafts":comic.draftpages
						}
					})
					callback(null);
	      }
			} catch (err) {
				callback(err);
			}
		})
	}

	/**Asynchronously PUTs the given draft page details into the given draft page.
	   callback: [](err)
		 - if no error occurred, err field is null*/
	putDraft(username:string, comic_uri: string, pageid: number, page_details: Page, callback: any) {
		var db=this.db;
		comic_uri = Comic.canonicalURI(comic_uri);
		this.getComic(username,comic_uri,function(err,comic){
			try {
				if (comic&&!err) {
					if (pageid<1)
						throw new Error("page id must be at least 1");
					comic.draftpages[pageid-1]=page_details;
					var comics = db.get('comics');
					comics.update({
						"urisan":comic_uri,
						"creator":username
					},
					{
						$set: {
							"drafts":comic.draftpages
						}
					})
					callback(null);
	      }
			} catch (err) {
				callback(err);
			}
		})
	}

	postAvatar(username:string, path:string, body: any, callback: any){
		var db = this.db;
		var users = db.get('users');
		this.getUser(username, function(err, user) {
			if (path == "") {
				path = user.getAvatar();
			}
			var name: string = body.name;
			if (body.name == "") {
				name = user.getName();
			}
			var email: string = body.email;
			if (body.email == "") {
				email = user.getEmail();
			}
			var hash: string = bcrypt.hashSync(body.password, bcrypt.genSaltSync(3));
			if (body.password == "") {
				hash = user.getHash();
			}
			var description: string = body.description;
			if (body.description == "") {
				description = user.getDescription();
			}
			var location: string = body.location;
			if (body.location == "") {
				location = user.getLocation();
			}
			var timezone: string = body.timezone;
			if (body.timezone == "") {
				timezone = user.getTimeZone();
			}
			var link: string = body.link;
			if (body.link == "") {
				link = user.getLink();
			}
			var subscription: string = body.description;
			if (body.subscription == "") {
				subscription = user.subscriptionChoice();
			}
			users.update({
				"username": username
			}, {
					$set: {
						"avatar": path,
						"name": name,
						"email": email,
						"hash": hash,
						"description": description,
						"location": location,
						"timezone": timezone,
						"link": link,
						"subscription": subscription

					}
				}, {
					upsert: true
				})
			console.log(user);
		});
	}

	// Asynchronously inserts the given image (by path) into the given page (counting from 1)
	// callback: [](err, new_panel_id)
	// - if no error occurred, err field is null
	// - otherwise, new_panel_id is the id of the new panel
	postPanel(username:string, comic_uri:string, page:number, path:string, callback: any){
		var db=this.db;
		if (page<1)
			callback(new Error("page must be at least 1"),null);
		comic_uri = Comic.canonicalURI(comic_uri);
		this.getComic(username,comic_uri,function(err,comic){
			try {
				if (comic&&!err) {
					var pages=comic.draftpages;
					//TODO: check page less than maximum page count
					var panel_map=comic.panel_map;
					var new_panel_id=panel_map.length;
					//add new panel to the page:
					pages[page-1].panels.push(new_panel_id);
					pages[page-1].edited=true;
					//add new panel to map
					panel_map.push(path);
					var comics = db.get('comics');
					comics.update({
						"urisan":comic_uri,
						"creator":username
					},
					{
						$set: {
							"drafts":pages,
							"panel_map":panel_map
						}
					})
					callback(null,new_panel_id);
	      }
			} catch (err) {
				callback(err,null);
			}
		})
	}
		
	// creates a hash for the given password
	computeHash(password: string): string {
		return bcrypt.hashSync(password,bcrypt.genSaltSync(3));
	}

	// returns true if the given password matches the given hash
	checkHash(password: string, hash: string): boolean{
		return bcrypt.compareSync(password,hash);
	}
}

export=DatabaseManager
