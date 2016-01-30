///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 
var DBManager = require("./DatabaseManager");
/** Represents a viewer of DropComix */
var Viewer = (function () {
    function Viewer(username, hash) {
        this.hash = hash;
        this.username = username;
    }
    Viewer.prototype.getHash = function () {
        return this.hash;
    };
    return Viewer;
})();
exports.Viewer = Viewer;
/** Represents a viewer of DropComix */
var Artist = (function () {
    function Artist(username, hash) {
        this.hash = hash;
        this.username = username;
    }
    Artist.prototype.getHash = function () {
        return this.hash;
    };
    return Artist;
})();
exports.Artist = Artist;
