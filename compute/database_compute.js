var path = require('path');

var appDir = path.dirname(require.main.filename);

var connection = require(appDir+'/compute/mysql.js');


var module_to_exp = {

   //============= GET actions
   get_profile : function(database_id,callback){
	    
		 connection.query("Select * from users where id = ?",database_id, function(err,rows){
            if(!err)
		      callback({status:'done', rows:rows});
            else{ 
			  console.log(err);
			  callback({status:'error'}); 
			}
		 });
	 
	 },
	
	get_comments: function(id ,callback){
		connection.query("Select * from comments LEFT JOIN users on comments.user_id = users.id where comments.event_id = ?", id , function(err,rows){
	        if(!err){
		      //clear unnecessary fields
			  for(var a in rows){
				  if(typeof rows[a] !== 'undefined'){
					delete rows[a].live_notifications;
					delete rows[a].auto_update_interests;
					
				  }
			  }
			  callback({status:'done', rows:rows});
            }else{
		      console.log(err);   
			  callback({status:'error'}); 
			}
		});
	},
	
	get_content: function(data, callback){
	   //get the events
	   connection.query("Select * from events order by id desc", function(err,rows){
		   if(!err){
			   callback({status:'done', rows:rows});
		   }else{
			   callback({status:'error'});
		   }
	   });
	},
	//============= POST actions
	save_profile : function(data, callback){
		
		connection.query("Update users set name = ?, facebook = ?, tags = ?, live_notifications = ?, auto_update_interests = ? where id = ?", [data.name, data.facebook, data.tags, data.live_notifications, data.auto_update_interests, data.id], function(err,rows){
			if(!err){
				callback({status:'done'});
			}else{
				console.log(err);
				callback({status:'error'});
			}
			
		});
	},
	
	add_event : function(data, callback){
		delete data.action;
		delete data.undefined;
		console.log(data);
        connection.query("Insert into events set ?",data, function(err,rows){
			if(!err){
				callback({status:'done'});
			}else{
				console.log(err);
				callback({status:'error'});
			}  
		});		
		 
	},
	
	update_tags: function(data, callback){
		
		connection.query("Update users set tags = CONCAT(tags, ?) where id = ?",[data.tags, data.id], function(err, rows){
			if(!err){
				callback({status:'done'});
			}else{
				console.log(err);
				callback({status:'error'});
			}
		});
	},
    
	add_comment: function(data, callback){
		
		connection.query("Insert into comments(user_id, event_id, text) values(?, ? ,?)",[data.my_id, data.id, data.comment], function(err,rows){
			console.log(rows);
			if(!err){
				callback({status:'done', id:rows.insertId});
			}else{
				console.log(err);
				callback({status:'error'});
			}
		});
		
	},
	
	remove_comment: function(data,callback){
		connection.query("Delete from comments where comment_id = ? and user_id = ?", [data.comm_id, data.user], function(err,rows){
			if(!err){
				callback({status:'done'});
			}else{
				console.log(err);
				callback({status:'error'});
			}
		});
	}
   
}

module.exports = module_to_exp;
