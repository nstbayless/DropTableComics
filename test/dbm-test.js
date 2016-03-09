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
		it('must be able to store some artists', function() {
			for (var i=0;i<artist_names.length;i++) {
				dbManager.createArtist(artist_names[i],
						artist_names[i]+"@somewebsite.com",
						artist_names[i]+"_123456");
			}
		});

		it('must be able to retrieve those artists', function(done) {
			var get_user = function(i) {
				var name=artist_names[i];
				dbManager.getUser(artist_names[i],function(err,user){
					if (err) throw err;
					assert.ok(user,'user not retrieved');
					assert.equal(name,user.getUsername(name),'username mutated');
					assert.equal(name+"@somewebsite.com",user.getEmail(name),'email mutated');
					//cannot test if password is equal b/c password not stored.
					assert.notEqual(name+"_123456",user.getHash(name),'password not hashed!')
					assert(checkHash(name+"_123456",user.getHash(name)),'password hash mutated')
				})
				if (i<artist_names.length)
					get_user(i+1);
				else
					done();
			}
			get_user(0);
		})
		
		it('must reject if artist already exists', function(){
			for (var i=0;i<artist_names.length;i++) {
				assert.throws(dbManager.createArtist(artist_names[i],
						artist_names[i]+"@somewebsite.com",
						artist_names[i]+"_123456"));
			}
		})

		it('must reject artists with weird names', function(){
			var badcharacters = "";
			for (var i=0;i<256;i++){
				badcharacters += String.fromCharCode( i );
			}
			badcharacters.replace(/[a-z][A-Z][0-9]~/g,'')
			for (var i=0;i<badcharacters.length;i++) {
				assert.throws(()=>{dbManager.createArtist("artist"+badcharacters.charAt(i),"a@b.c","abcd")},
						"accepted invalid character in artist name")
			}
		})
		
		it('must reject invalid email addresses', function(){
			assert.throws(()=>{dbManager.createArtist("artistname","notanaddress...","password123")})
		})
	})
}
