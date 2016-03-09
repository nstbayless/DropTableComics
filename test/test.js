//TO RUN: "npm install -g mocha; mocha"

require('should');
var assert = require('assert');
var monk = require('monk');
var MongoClient = require('mongodb').MongoClient
DB_PORT=27023;
DB_PATH='./data-test'

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
		//start new db
		this.timeout(4000);
		child=child.spawn(cmd,args);
		console.log("   starting db (2 seconds):")
		setTimeout(function() {
			console.log("   done (hopefully)")
			done();
		}, 700);
	})
	
	after(function(){
		db.close();
		child.kill('SIGSEGV');
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
});
