var path = require('path');
var redis = require('redis');


var appDir = path.dirname(require.main.filename);
var client = redis.createClient();

var database_compute = require(appDir + '/compute/database_compute.js');




/* HANDLER FOR POST REQUESTS */ 
var module_to_exp = { 
       
   handle: function(post, callback){
     //remove cache from redis for this action
     //key = get.action + '-' +post.id  
     var json = {
		'save_profile' : 'get_user_profile',
		'update_tags' : 'get_user_profile'
	 };
     var key = json[post.action] + '-' + post.id;

      
     client.select(0, function(){	  
	   client.del(key);
	 });
	 
	 switch(post.action){
	 
		case 'save_profile':
		  database_compute.save_profile(post,function(response){
			 callback(response); 
		  });
		
		break;
		
		case 'add_event':
		       
		  database_compute.add_event(post, function(response){
			  callback(response);
		  });
		 
		break;
		
		case 'update_tags':
		 
		  database_compute.update_tags(post, function(response){
			  callback(response); 
		  });
		
		break;
		
		case 'join':
		   client.select(1, function(){ //select redis database 1
		      console.log('redis_Test');
		      //create redis hkey
			  client.hset('list_going' + post.id, post.my_id , post.serial,function(err){
			     if(err){
					console.log(err);
                    callback({status:'error'});					
				 }
				 else
					callback({status:'done'});
			  });
		   });
		
		break;
		
		case 'unjoin':
		
		   client.select(1, function(){
		     client.hdel('list_going'+ post.id, post.my_id, function(err,rows){
				 console.log(post.id);
			     if(err){
					console.log(err);
                    callback({status:'error'});					
				 }
				 else
					callback({status:'done'}); 
			 });	   
		   });
		
		break;
		
		case 'send_comment':
		   console.log('asada');
		   database_compute.add_comment(post, function(response){
			  callback(response); 
		   });
		
		break;
		
		case 'delete_comm':
		   database_compute.remove_comment(post, function(response){
			  callback(response); 
		   });
		
		break;
		
		default:
		  return {'status':404};
		break;
	 }
   }
}

module.exports = module_to_exp;
