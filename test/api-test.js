require('should');
var http = require('http');
var assert = require('assert');
var request = require('supertest');
var dbManager;
var app;
var server;
var db;
var _HTTP_PORT = 3001;
var url = 'http://localhost:'+_HTTP_PORT+"/";

//jane is a cool gal with a cookie jar
var jane;
//joe is a pleb
var joe;

var _POSTPONE_CLEAR = false;

//keeps db for next it() test.
var persist_db = function (){
	_POSTPONE_CLEAR = true;
}
var persist=persist_db;

var loginpage_html;

module.exports = function(db_v,cleardb) {
	before(function(done) {
		this.timeout(4000);
		db=db_v
		app=new (require('../app'))(db).getApp();
		server = http.createServer(app);
		server.listen(_HTTP_PORT);
		setTimeout(function(){
			done();
		},100);
		var address="http://localhost:"+_HTTP_PORT;
		jane = request.agent(address);
		jane.jar.setCookie('credentials={"username": "jane", "password": "abcd"}');
		joe = request.agent(address);
	});

	beforeEach( function(done) {
		if (_POSTPONE_CLEAR) {
			_POSTPONE_CLEAR=false;
			return done();
		}
		cleardb(function(){done();});
	});

	describe('(test http connection)', function() {

		it('should be able to access login page',function(done) {
			jane.get('/auth/login')
				.expect('Content-Type', /html/)
				.expect(200)
				.end(function (err,res) {
					if (err) throw err;
					loginpage_html=res.text;
					done();
				})
		})

		it('should be able to register',function(done) {
			jane.post('/auth/accounts')
				.send({username: "jane", email: "jane@somewebsite.com", account_type: "artist", password: "abcd"})
				.expect(200)
				.end(function (err,res) {
					if (err) throw err;
					done();
				})
			persist();
		})

		it('should not see log-in page when accessing dashboard (after logging in)',function(done) {
			jane.get('/')
				.expect('Content-Type', /html/)
				.expect(200)
				.end(function (err,res) {
					if (err) throw err;
					if (res.text==loginpage_html)
						throw "Error: saw login page";
					done();
				})
		})
	})
}
