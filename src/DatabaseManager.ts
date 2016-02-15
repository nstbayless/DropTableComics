///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 

/** Represents a manager of the database, through which Users and Comics access the database*/
import User = require('./User');
import { Comic } from './Comic';
var bcrypt = require('bcrypt');

class DatabaseManager {

	// mongo database
	private db: any

	constructor(db: any) {
		this.db=db;
	}

	// creates a new Artist and adds it to the database
	createArtist(username: string, password: string, email: string): User.Artist {
		var hash = this.computeHash(password);
		var artist = new User.Artist(username);
		artist.hash=hash;
		artist.email=email;
		var users = this.db.get('users');
		console.log("creating artist")
		users.insert({username:username,hash:hash,type:"artist",email:email});
		return artist;
	}

	// creates a new Viewer and adds it to the database
	createViewer(username: string, password: string, email: string): User.Viewer {
		var hash = this.computeHash(password);
		var viewer = new User.Viewer(username);
		viewer.hash=hash;
		viewer.email=email;
		var users = this.db.get('users');
		users.insert({username:username,hash:hash,type:"pleb",email:email});
		return viewer;
	}

	// asynchronously retrieves the given user from the database
	// callback: [](err,user)
	getUser(username: string, callback:any) {
		var users = this.db.get('users');
		users.findOne({username:username}, function(err,user_canon){
			if (err||!user_canon) return callback(err,null);
			var user: User.User;
			if (user_canon.type=="artist")
			user = new User.Artist(user_canon.username);
			else if (user_canon.type=="pleb")
			user = new User.Viewer(user_canon.username);
			else
				throw new Error("Corrupted database: user.type == '" + user_canon.type + "'")
			//fill user fields based on canononical version of user...
			user.hash=user_canon.hash;
			user.email=user_canon.email;
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
									"pages": comic.pages});
		return comic;
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
			comic.pages = comic_canon.pages;
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
					if (viewlist.indexOf(user) === -1) {
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
					var pages=comic.pages;
					var panel_map=comic.panel_map;
					var new_panel_id=panel_map.length;
					//add new panel to the page:
					pages[page-1].push(new_panel_id)
					//add new panel to map
					panel_map.push(path);
					var comics = db.get('comics');
					comics.update({
						"urisan":comic_uri,
						"creator":username
					},
					{
						$set: {
							"pages":pages,
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
