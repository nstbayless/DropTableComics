///<reference path='types/node/node.d.ts'/>
///<reference path='types/express/express.d.ts'/> 
//configuration options
var config = {
    secret: "badsecret",
    //Should come up with a more secure handler for this...
    db: 'localhost:27018/cpsc310',
    port: '8877',
    porthttps: '3001',
    https: false //use https instead of http; run https-genkey before 
};
module.exports = config;
