var path = require('path');
var express = require('express');
var redis = require('redis');
var router = express.Router();

var appDir = path.dirname(require.main.filename);
var client = redis.createClient();

var database_compute = require(appDir + '/compute/database_compute.js');
var get_requests = require(appDir + '/routes/get_requests.js');
var post_requests = require(appDir + '/routes/post_requests.js');


/* GET  */
router.get('/', function(req, res) {

  get_requests.handle(req.query, function(response){

	if(response.create_cache){
        //create redis cache
	    //key = get.action + '-' +get.id
	    console.log('create_cache');
        response.create_cache = false;		
        var key = req.query.action + '-' +req.query.id;	
	    client.set(key, JSON.stringify(response)); 
  	}
	
    res.json(response);
	res.end();
  });
});

/* POST */
router.post('/', function(req, res) {
  
  post_requests.handle(req.body, function(response){
	  
    res.json(response);
	res.end();
  });
});


module.exports = router;
