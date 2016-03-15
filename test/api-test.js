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
			persist();
		})

		var uri_editdash="/editdashboard";
		var uri_account ="/profile/jane";
		var uri_avatar = "/accounts/jane/avatar";
		var path_image = __dirname.replace(/\/test$/,"") + "/public/images/icon_share.png"

		describe("POST " + uri_editdash + " + GET " + uri_account,function() {

			var jane_info = {
				name: "Jane Arnold Doe",
				description: "My name is Jane and I like cats!",
				email: "janedoe@somewebsite.com",
				location: "Somewhere, Florida",
				link: "http://www.google.com"
			}

			//tests posting user info to site
			var test_post_info = function(info_type) {
				return function(done) {
					obj_to_send = {}
					obj_to_send[info_type]=jane_info[info_type];
					jane.post(uri_editdash)
						.send(obj_to_send)
						.expect(302)
						.end(function (err,res) {
							if (err) throw err;
							jane.get(uri_account)
								.expect(200)
								.end(function(err,res) {
									if (err) throw err;
									if (res.text.indexOf(jane_info[info_type])>0)
										done();
									else
										throw "Error: cannot find " + info_type + " text on profile page."
								})
						})
					persist();
				}
			}

			for (var property in jane_info)
				if (jane_info.hasOwnProperty(property))
					it ('should be able to edit ' + property, test_post_info(property))

			it ('should be able to edit avatar', function(done){
				var avatar_data;
				this.timeout(3000);
				jane.get(uri_avatar)
					.expect(200)
					.end(function(err,res) {
						if (err) throw err;
						avatar_data=res.body;
						jane.post(uri_editdash)
							.field('image', 'my avatar')
							.attach('image',__dirname + "/../public/images/icon_share.png")
							.expect(302)
							.end(function(err,res) {
								if (err) throw err;
								setTimeout(function(){
									jane.get(uri_avatar)
										.expect(200)
										.end(function(err,res) {
											if (err) throw err
											assert.notEqual(avatar_data,res.body)
											done();
										})
									},50)
							})
					})
				
				persist();
			})

		})
	})
}
