///<reference path='types/node/node.d.ts'/>
  
///<reference path='types/express/express.d.ts'/> 

//configuration options

var config = {
  secret: "badsecret", //used for authentication.
                     //Should come up with a more secure handler for this...

  db:     'localhost:27018/cpsc310', //path to database
  port:   '3000',     //port to serve on
};
module.exports = config
