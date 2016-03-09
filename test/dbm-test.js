require('should');
var assert = require('assert');
var DatabaseManager = require('../src/DatabaseManager')
var dbManager;
var db;

module.exports = function(db_v,cleardb) {
	before( function() {
		db=db_v
		dbManager = new DatabaseManager(db);
	});

	beforeEach( function(done) {
		cleardb(function(){done();});
	});
	
	describe('#constructor', function(){
		it('must be able to construct dbManager instance',function() {
			assert.equal(!!dbManager,true);
		});
		it('must pass db object to dbManager',function() {
			assert.equal(dbManager.db,db);
		});
	});

	describe('(test db connection)', function() {
		it('db exists',function(){
			assert.equal(true,!!db);
		});
		it('should be able to insert into db', function(){
			return db.get('test_col').insert({testfield: 'test'});
		});
	});

	describe('(test db reset)', function() {
		it('should not be able to load previous insert after clear', function(){
			return db.get('test_col').find({testfield: 'test'}).should.eventually.have.length(0);
		});
	});
}
