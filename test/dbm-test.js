require('should');
var assert = require('assert');
var DatabaseManager = require('../src/DatabaseManager')
var dbManager;
var db;
var async = require('async');
var _POSTPONE_CLEAR = false;

//keeps db for next it() test.
var persist_db = function (){
	_POSTPONE_CLEAR = true;
}

var throw_err = function(done,msg){
	return function(err){
		if (err) throw msg | err;
		done();
	}
}

var throw_not_err = function(done,msg){
	return function(err){
		if (!err) throw msg | "expected error";
		done();
	}
}

module.exports = function(db_v,cleardb) {
	before( function() {
		db=db_v
		dbManager = new DatabaseManager(db);
	});

	beforeEach( function(done) {
		if (_POSTPONE_CLEAR) {
			_POSTPONE_CLEAR=false;
			return done();
		}
		cleardb(function(){done();});
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

	describe('#constructor', function(){
		it('must be able to construct dbManager instance',function() {
			assert.equal(!!dbManager,true);
		});
		it('must pass db object to dbManager',function() {
			assert.equal(dbManager.db,db);
		});
	});

	describe('#createArtist #getUser', function(){

		var artist_names = ['shyguy', 'NaOH', 'NAAh5005']
		for (var i=0;i<12;i++) artist_names.push('artist'+i);
		it('must be able to store some artists', function(done) {
			for (var i=0;i<artist_names.length;i++) {
				dbManager.createArtist(artist_names[i],
						artist_names[i]+"_123456",
						artist_names[i]+"@somewebsite.com", function(err){if (err) throw err;});
			}
			setTimeout(function(){done();},500)
			persist_db()
		});

		it('must be able to retrieve those artists', function(done) {
			var calls=[];
			var j =0;
			for (var i=0;i<artist_names.length;i++) {
				calls.push(function(callback){
					var name=artist_names[j++];
					dbManager.getUser(name,function(err,user){
						if (err) throw err;
						assert.ok(user,'user not retrieved');
						assert.equal(name,user.getUsername(name),'username mutated');
						assert.equal(name+"@somewebsite.com",user.getEmail(name),'email mutated');
						//cannot test if password is equal b/c password not stored.
						assert.notEqual(name+"_123456",user.getHash(name),'password not hashed!')
						assert(dbManager.checkHash(name+"_123456",user.getHash(name)),'password hash mutated')
						callback();
					});
				});
			}
			async.parallel(calls,function(){
				persist_db();
				done();
			});
		});
		
		it('must reject if artist already exists', function(done){
			var j=0;
			d=function(){if (++j>=artist_names.length) done()}
			for (var i=0;i<artist_names.length;i++) {
				dbManager.createArtist(artist_names[i],
						artist_names[i]+"@somewebsite.com",
						artist_names[i]+"_123456", throw_not_err(d,"did not reject"));
			}
		})

		it('must reject artists with weird names', function(done){
			var badcharacters = "";
			for (var i=0;i<256;i++){
				badcharacters += String.fromCharCode( i );
			}
			badcharacters.replace(/[a-zA-Z0-9~]/g,'')
			var j=0;
			d=function(){if (++j>badcharacters.length) done();}
			for (var i=0;i<badcharacters.length;i++) {
				dbManager.createArtist("artist"+badcharacters.charAt(i),"a@b.c","abcd",
					throw_not_err(d,"accepted artist with invalid character in name"))
			}
			dbManager.createArtist("jo","a@b.c","abcd",
				throw_not_err(d,"accepted artist with very short name"))
		})

		return;
		
		it('must reject invalid email addresses', function(){
			dbManager.createArtist("artistname","notanaddress...","password123"),throw_err(d,"accepted invalid email address")
		})
	})
}
