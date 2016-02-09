///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 

/** Represents a manager of the database, through which Users and Comics access the database*/
import User = require('./User');
import { Comic } from './Comic';
var bcrypt = require('bcrypt');

class DatabaseManager {

	//mongo database
	private db: any

	constructor(db: any) {
		this.db=db;
	}

	//creates a new Artist and adds it to the database
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

	//creates a new comic and adds it to the database
	createComic(name: string, artist: string, description:string): Comic {
		var comic = new Comic(name, artist, description);
		var viewlist = new Array<string>();
		var adminlist = new Array<string>();
		var editlist = new Array<string>();
		editlist[0] = artist;
		adminlist[0] = artist;
		var comics = this.db.get('comics');
		console.log("creating comic");
		comics.insert({"title":name,"viewlist":viewlist,"editlist":editlist,"adminlist":adminlist,"creator":artist, "description":description, "image_collection":comic.getImageCollection()});
		return comic;
	}

	//creates a new Viewer and adds it to the database
	createViewer(username: string, password: string, email: string): User.Viewer {
		var hash = this.computeHash(password);
		var viewer = new User.Viewer(username);
		viewer.hash=hash;
		viewer.email=email;
		var users = this.db.get('users');
		users.insert({username:username,hash:hash,type:"pleb",email:email});
		return viewer;
	}

	//asynchronously retrieves the given user from the database
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
	// asynchronously retrieves the given comic from the database
	// callback: [](err,comic)
	getComic(comic_name: string, username:string, callback:any) {
		console.log(comic_name);
		var comics = this.db.get('comics');
		comics.findOne({title:comic_name, creator:username}, function(err,comic_canon){
			if (err||!comic_canon){ 
				console.log("whoops, it seems we can't find the comic");
				return callback(err,null); 
			}
			var comic: Comic;
			comic = new Comic(comic_name, username, null);
			comic.viewlist = comic_canon.viewlist;
			comic.editlist = comic_canon.editlist;
			comic.adminlist = comic_canon.adminlist;
			comic.pages = comic_canon.pages;
			comic.description = comic_canon.description;
			callback(null,comic);
		});
	}
	// Inserts the given image (path and name) into the database
	insertImage(image_collection_name:string, path:string, name:string){
		var image_collection = this.db.get(image_collection_name);
		image_collection.insert({path:path,name:name});
		}
		
		// Async gets the given image from the database
		// callback: [] (err, file)
	getImage(image_collection_name:string, name:string, callback:any){
		var image_collection = this.db.get(image_collection_name);
		image_collection.findOne({name:name}, function(err,img){
			if (err||!img){ 
				console.log("No image");
				return callback(err,null); 
			};
			console.log('DETAILS OF FILE IN DATABASE');
			console.log(img);
			console.log('RETURNING');
			console.log(img.path);
			callback(null, img.path);
		});
		}
	// Return Image Collection object, given name	
	getImageCollection(image_collection_name:string){
		var image_collection = this.db.get(image_collection_name);
	}
		
	//creates a hash for the given password
	computeHash(password: string): string {
		return bcrypt.hashSync(password,bcrypt.genSaltSync(3));
	}

	//returns true if the given password matches the given hash
	checkHash(password: string, hash: string): boolean{
		return bcrypt.compareSync(password,hash);
	}
}

export=DatabaseManager
