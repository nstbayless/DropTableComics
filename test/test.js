//TO RUN: "npm install -g mocha; mocha"

require('should');
var assert = require('assert');
var monk = require('monk');
var MongoClient = require('mongodb').MongoClient
var ProgressBar = require('progress');
var config = require('../config');

//db configuration constants
DB_PORT=27024;
DB_PATH='./.data-test'

//if the test suite cannot connect to the db, try increasing TIME_WAIT
var TIME_WAIT = 800;
var TICK_MAX = 75;
config.db='localhost:'+DB_PORT;
config.securecookie=false;

//start mongod:
var child = require('child_process');
var db;

var cmd = 'mongod', args = ('--port '+DB_PORT+' --dbpath '+DB_PATH).split(' ');
console.log("beginning test of backend (src/)")

var cleardb = function(cb) {
	MongoClient.connect('mongodb://localhost:'+DB_PORT, function(err,db2) {
			if (err)
				throw err;
			db2.dropDatabase();
			cb();
	})
}

db = monk('localhost:'+DB_PORT);

describe('Database Test', function() {
	before(function() {
		//clear old db
		child.exec("rm -rf " + DB_PATH + "; mkdir " + DB_PATH)
	})

	before(function(done) {
		var bar = new ProgressBar(':bar', {
			total: TICK_MAX,
			clear:true,
			callback: function(){
				console.log("   done (hopefully)");
				done();
				clearInterval(timer);
			}
		});
		var timer = setInterval(function () {
		  bar.tick();
		}, TIME_WAIT/TICK_MAX);
		//start new db
		this.timeout(4000);
		child=child.spawn(cmd,args);
		console.log("   starting db (2 seconds):")
	})
	
	after(function(){
		try {
			child.kill('SIGSEGV');
		} catch (err){/*suppress*/ }
		require('child_process').exec("rm -rf " + DB_PATH);
	})

  describe('(test db connection)', function() {
    it('should be able to insert', function() {
      var test_col = db.get('test');
			return test_col.insert({testfield: 'test'});
    });
		it('should be able to retrieve', function() {
      var test_col = db.get('test');
			return test_col.find({testfield: 'test'}).should.eventually.have.length(1);
    });
  });

	describe('DatabaseManager',function () {
		require('./dbm-test')(db,cleardb);
	})

	describe('RESTful API', function(){
		require('./api-test')(db,cleardb);
	})
});
