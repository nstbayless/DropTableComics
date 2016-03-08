require('should');
var assert = require('assert');
var DatabaseManager = require('../src/DatabaseManager')
var dbManager;

module.exports = function(db) {
	before( function() {
		dbManager = new DatabaseManager(db);
	});
	
	describe('#constructor', function(){
		it('must be able to construct dbManager instance',function() {
			assert.equal(!!dbManager,true);
		});
		it('must pass db object to dbManager',function() {
			assert.equal(dbManager.db,db);
		});
	});
}
