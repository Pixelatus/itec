var path = require('path');
var redis = require('redis');

var appDir = path.dirname(require.main.filename);
var database_compute = require(appDir + '/compute/database_compute.js');
var client = redis.createClient();


/* HANDLER FOR GET REQUESTS */ 
var module_to_exp = { 
       
   handle: function(get, callback){ 

     //redis cache layer for get requests
     //key = get.action + '-' +get.id  
     var key = get.action + '-' +get.id;
	 
	 var ignore_redis_list = []; //actions for redis to ignore

	 client.select(0, function(){ //return to 0 database
		 
		 client.get(key, function(err,reply){

		   if(reply && (ignore_redis_list.indexOf(get.action) < 0) ){
			   
			  reply = JSON.parse(reply);
			  reply.create_cache = false;
			  callback(reply); //return cache from redis  
			  
		   }else{
			  
			  switch(get.action){
		       
			   case 'get_user_profile':
			     //console.log('asada');
				 database_compute.get_profile(get.id, function(response){
					
					response.create_cache = true; // create cache 
					
					if(response.status == 'done'){
					  callback(response);
					}else{
					  callback({status:'error'});
					}
				 });
				 
			   break;
			   
			   case 'get_comments':
			     database_compute.get_comments(get.id, function(response){
					if(response.status == 'done'){
					  callback(response);
					}else{
					  callback({status:'error'});
					} 
				 });
			   
			   break;
			   
			   case 'get_content':
			     
				 database_compute.get_content(get, function(response){
				   if(response.status == 'done'){
					 
					 client.select(1, function(err){
					   //load rows
					   var rows = response.rows;
					   module_to_exp.handle({action:'get_user_profile', id:get.id}, function(response){
				         var user_data = response.rows[0];
					     if(user_data['tags'].length > 1){
					       var user_tags = user_data['tags'].split(',');
					   
					       // intersect tags
						   var a = 0;
					       var recursive = function(a){
						     if(typeof rows[a] !== 'undefined'){
							   
							   if(typeof rows[a].rank == 'undefined')
								   rows[a].rank = 0;
							   
							   var row_tags = rows[a].tags.split(','); 
							   for(var b in user_tags){
								   if(row_tags.indexOf(user_tags[b]) > -1)
									   rows[a].rank++;
							   }
						       //get going from redis
							   client.select(1, function(){
							     client.hgetall('list_going' + rows[a].id, function(err,go){
								     rows[a].going = go;							 
								     recursive(++a); //call again
							     });
							   });
						   
						     }else
							  {
								 rows.sort(function(a, b) {
							       return (b.rank || 0) - (a.rank || 0);
						         });
								 console.log(rows);
						         callback({rows: rows, user:user_data, status:'done'});	
						
							  }
						   }
                           recursive(a);							
					     }
						 //order by given rank
						 
                       });					   
					 }); //get user from cache or mysql
					 
				   }else{
					  callback({status:'error'});
				   }
				 });
			  
			   break;
			   
			   default:
				  return {'status':404};
			   break;
			   
			 }
		   }
		   
		 });
	
	 });
    
   }
}

module.exports = module_to_exp;
