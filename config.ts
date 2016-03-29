///<reference path='types/node/node.d.ts'/>
  
///<reference path='types/express/express.d.ts'/> 

//configuration options

var config = {
  secret:    "badsecret", //used for authentication.
                     //Should come up with a more secure handler for this...

  db:        'localhost:27018/cpsc310', //path to database
	securecookie: true, //use http-only cookies
  port:      '3000',     //port to serve on
  porthttps: '3001',     //port to serve on for https
  https:      false,      //use https instead of http; run https-genkey before

	//site logic customization
	email:      true,	     //use email notifications
	email_user: "dropcomixupdates@gmail.com",
	email_pass: "arnold4ever",

	//mocha testing options
	test_api: true,
	test_dbm: false
};
module.exports = config
