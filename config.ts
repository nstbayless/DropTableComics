///<reference path='types/node/node.d.ts'/>
  
///<reference path='types/express/express.d.ts'/> 

//configuration options

var config = {
  secret:    "badsecret", //used for authentication.
                     //Should come up with a more secure handler for this...

  db:        'localhost:27018/cpsc310', //path to database
  port:      '8877',     //port to serve on
  porthttps: '3001',     //port to serve on for https
  https:      false      //use https instead of http; run https-genkey before 
};
module.exports = config
