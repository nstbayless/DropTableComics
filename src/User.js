///<reference path='../types/node/node.d.ts'/>  
///<reference path='../types/express/express.d.ts'/> 
/** Represents a viewer of DropComix */
var Viewer = (function () {
    /** CONSTRUCTOR */
    function Viewer(username) {
    } /** stub */
    /** GETTERS */
    Viewer.prototype.getUsername = function () {
        return this.username;
    };
    Viewer.prototype.getViewlist = function () {
        return this.viewlist;
    };
    Viewer.prototype.getManager = function () {
        return this.manager;
    };
    Viewer.prototype.getDescription = function () {
        return this.description;
    };
    Viewer.prototype.getHash = function () {
        return this.hash;
    };
    return Viewer;
})();
exports.Viewer = Viewer;
/** Represents an artist on DropComix */
var Artist = (function () {
    /* INVARIANT:  A comic is on at most one list */
    /** CONSTRUCTOR */
    /** Looks up Artist from database by name */
    function Artist(username) {
    } /** stub */
    /** GETTERS */
    Artist.prototype.getUsername = function () {
        return this.username;
    };
    Artist.prototype.getViewlist = function () {
        return this.viewlist;
    };
    Artist.prototype.getEditlist = function () {
        return this.viewlist;
    };
    Artist.prototype.getAdminlist = function () {
        return this.viewlist;
    };
    Artist.prototype.getManager = function () {
        return this.manager;
    };
    Artist.prototype.getDescription = function () {
        return this.description;
    };
    Artist.prototype.getHash = function () {
        return this.hash;
    };
    return Artist;
})();
exports.Artist = Artist;
