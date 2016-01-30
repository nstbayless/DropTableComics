///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 
/** Represents a manager of the database, through which Users and Comics access the database*/
var User = require('./User');
var DatabaseManager = (function () {
    function DatabaseManager(db) {
        this.db = db;
    }
    //creates a new Artist and adds it to the database
    DatabaseManager.prototype.createArtist = function (username, password) {
        var hash = this.computeHash(password);
        var artist = new User.Artist(username, hash);
        var users = this.db.get('users');
        console.log("creating artist");
        users.insert({ username: username, hash: hash, type: "artist" });
        return artist;
    };
    //creates a new Viewer and adds it to the database
    DatabaseManager.prototype.createViewer = function (username, password) {
        var hash = this.computeHash(password);
        var viewer = new User.Viewer(username, hash);
        var users = this.db.get('users');
        users.insert({ username: username, hash: hash, type: "pleb" });
        return viewer;
    };
    //asynchronously retrieves the given user from the database
    // callback: [](err,user)
    DatabaseManager.prototype.getUser = function (username, callback) {
        var users = this.db.get('users');
        users.findOne({ username: username }, function (err, user_canon) {
            if (err || !user_canon)
                return callback(err, null);
            var user;
            if (user_canon.type == "artist")
                user = new User.Artist(user_canon.username, user_canon.hash);
            else if (user_canon.type == "pleb")
                user = new User.Viewer(user_canon.username, user_canon.hash);
            else
                throw new Error("Corrupted database: user.type == '" + user_canon.type + "'");
            //fill user fields based on canononical version of user...
            callback(null, user);
        });
    };
    //creates a hash for the given password
    DatabaseManager.prototype.computeHash = function (password) {
        //TODO(NaOH): encrypt passwords
        return password;
    };
    //returns true if the given password matches the given hash
    DatabaseManager.prototype.checkHash = function (password, hash) {
        return password == hash;
    };
    return DatabaseManager;
})();
module.exports = DatabaseManager;