 $(document).ready(function(){
	
	
	if(!localStorage['joined'])
		localStorage['joined'] = '';
	
	if(!localStorage['commented_on'])
		localStorage['commented_on'] = '';
	
	//load html elements to edit
	var html = {
		overlay: $('div#overlay'),
		modal  : $('div.modal_box')
	}
	
	//options
	var options = {
		api    : 'http://127.0.0.2:3000/requests',
		joined : false,
		join_id: 0,
	}
	
	var profile_info = { //used for sealized data sent via socket io
		name : 'Cozloschi Florin',
		id   : 1,
		tags : 'a,b,c,d,e,tag1',
		facebook: 'asdadada',
		update_i: 1,
		live_not: 1
	}
	
	//get and post requests function
	var get = function(params, callback){
	   $.get(options['api'], params, function(response){
		   callback(response);
	   },'JSON');
	}
	
	var post = function(params, callback){
	   $.post(options['api'], params, function(response){
		   callback(response);
	   },'JSON');
	}
	 
	//add joined button
    if(localStorage['joined'] != ''){
		//change header_button
		$('button.open_event').removeClass('open_event').addClass('joined').text("Joined").attr('data-id', localStorage['joined']).attr('onclick',"ui_functions.modal_box.open('big',this)").attr('data','{"action":"joined","data":{}}');			 
	}	
	 
	 
    //public functions
    window.ui_functions = {
		overlay_show : function(bool){

   	 	      if(bool)
				  html['overlay'].find('img').hide();
			  else
				  html['overlay'].find('img').show();
			  
			  html['overlay'].show();
			  
		},
		overlay_hide : function(){
			
			html['overlay'].hide();
			html['overlay'].find('.modal_small').remove();
			html['overlay'].find('.modal_big').remove();
			
		},
		get_comments: function(id){
			var obj = {
				action : 'get_comments',
				id : id
			}
			
			var $append = $('div.comments_holder');
			$append.find('span').html(' ');
			
			get(obj, function(response){
				if(response.rows.length > 0){
				  for(var a in response.rows){
					$append.append(ui_functions.render_comment({comment_id: response.rows[a].comment_id,user_id: response.rows[a].user_id, name : response.rows[a].name, text: response.rows[a].text}));
				  }
				}else{
				  $append.find('span').text('Sorry, no comments to show yet :(');	
				}
			});
			
		},
		render_comment: function(data){
		   var edit = data.user_id == profile_info.id ? "<span data='"+data.comment_id+"' class='comm_edit'> <span data='"+data.comment_id+"' class='delete_comm'> Delete </span></span>" : "";
		   
		   
		   return "<div class='comm' style='font-size:14px;border-bottom:1px solid #e0e0e0'>" + edit + " <span class='name' style='cursor:pointer' onclick=ui_functions.modal_box.open('small',this) > " + data.name + " </span>" +
                  "<p class='comment'>" + data.text + "</p>"+
                  "</div>";				  
		},
		render_profile: function(id){
		   get({action:'get_user_profile', id: id}, function(response){
			  var profile = response.rows[0];
              var html = '';
			  var a;
			  for(var a in profile.tags.split(',')){
				  html += '<span>' + profile.tags.split(',')[a] + '</span>';
			  }
              $('div.profile').html(" <a href='" + profile.facebook +"'><img src='/images/user.png' /> </a>"+
			                        " <h1> " + profile.name + "</h1>" +
									" <div class='tags'>" + html + "</div>");
			  
		   });
		},
		render_event: function(data){
		   
           var html = $('article.post:nth-of-type(1)').clone();
            
           //add title and description
           var $content = html.find('div.right_article');

           $content.find('h1').text(data.title).append('<span class="date"> '+data.start+' </span>');
           $content.find('p').text(data.description);
           //$content.find('h1').find('span').text(data.start);

		   var html_going = '';
           for(var a in data.going){
			   var serialize = JSON.parse(data.going[a]);
			   serialize.action = 'profile';
			   
			   var seria = {action:'profile', id: serialize.id, data:{ id : serialize.id}};
			   html_going += "<span onclick=ui_functions.modal_box.open('small',this) data="+ JSON.stringify(seria) +"> " +serialize['name']+ "</span>,"; 
		   }
           
		   if(html_going.substr(-1) == ',')
			  html_going = html_going.substr(0,html_going.length-1);
		   
		   html.find('div.going').html(html_going);
		   
		   //add tags
           var $tags = html.find('div.tags');
            
           $tags.find('span').each(function(){
			  if(!$(this).hasClass('location') && !$(this).hasClass('date') && !$(this).hasClass('comment'))
                $(this).remove();				  
		   });		
		   
		   var tags_split = data.tags.split(',');
		   
		   for(var a in tags_split){
			   $tags.append("<span>"+tags_split[a].trim()+"</span>");
		   }
		   //add join button data
		   html.find('button.join').attr('data-id',data.id);
		   //console.log(Date.parse('1/1/2011 '+data.start.split(':')[0].trim()+':'+data.start.split(':')[1].trim()+':45'));
		   if(localStorage['joined'] != '')
		     html.find('button.join').hide(); 
           
           if((Date.parse('1/1/2011 '+data.start.split(':')[0].trim()+':'+data.start.split(':')[1].trim()+':45') < Date.parse('1/1/2011 '+new Date().getHours()+':'+ new Date().getMinutes()+':45')))
			 html.find('button.join').addClass('expired').hide(); 
             
		   
		   //add location adress
		   $tags.find('span.location').attr('adress', data.adress);
		   
		   $tags.find('span.comment').attr('data-id', data.id);
		   
		   html.css('display','block');
		   html.attr('data',data.id);
		   
		   html.removeClass('start');
		   
		   return html;
		   
		},
		modal_box:{ //modal box
		  open : function(type,elem){
			  
			  ui_functions.overlay_hide();
			  
			  var data = JSON.parse($(elem).attr('data'));
			   
			  if(Object.keys(data.data).length == 0) data.data = profile_info;
			  
			  ui_functions.overlay_show(true); //show overlay without loading
			  html['overlay'].append('<div class="modal_'+type+'">' +ui_functions.modal_box.html(data.action, data.data, elem)+ '</div>');
			  
			  //if joined
			  if(data.action == 'joined'){
				  
				  localStorage['joined'] = $(elem).attr('data-id');
				  
				  $('button.join').each(function(){
					  $(this).hide(); 
				  });
				   
				  var $article = $('article.post.join_post');
				  
				  $article.find('span.location').remove();
				  $article.find('span.comment').remove();
				  $article.find('button.join').removeClass('join').addClass('unjoin').removeAttr('onclick').text('Unjoin').show();
			      
		          //comments
		          $article.append('<script type="text/javascript"> ui_functions.get_comments('+ localStorage['joined'] +'); </script>');
		   
			  }
			  
			  
		  },
		  html : function(which, data, elem){ //html for every module
			  switch(which){
				  
				  case 'profile':
				    
					  return "<div class='profile'> Loading.. <script type='text/javascript'> ui_functions.render_profile("+data.id+"); </script></div>";
			
				  break;
				  
				  case 'location':    
				    return "<div class='google_map'> <img src='http://maps.googleapis.com/maps/api/staticmap?center="+$(elem).attr('adress')+"&size=1200x700&sensor=true&visualRefresh=true' style='width:100%;height:100%'> </div>";
				  break;
				  
				  case 'comment':
				    return "<div style='padding:10px'><div class='comments_holder'><span style='width:100%;display:block;text-align:center;font-size:14px;color:#a4a4a4;margin-top:20px'> </span><script type='text/javascript'> ui_functions.get_comments(" +$(elem).attr('data-id') +"); </script></div></div>";
				  break;
				  
				  case 'joined':
				     
					 var join_id = $('button.joined').attr('data-id') || $(elem).attr('data-id');
					 var html = "<article class='post join_post' style='margin-top:40px'>" + $('article.post[data='+join_id+']').html() + "</article><div class='comments'> <div class='comments_holder'> <span style='width:100%;display:block;text-align:center;font-size:14px;color:#a4a4a4' class='no_comments'><img src='/images/tiny_loading.gif' /></span></div><textarea class='comments' placeholder='Your comment here'></textarea> <button class='send_comment'>Send Comment</button> </div>";
					 	 
					 //change header_button
					 $('button.open_event').removeClass('open_event').addClass('joined').text("Joined").attr('data-id', join_id).attr('onclick',"ui_functions.modal_box.open('big',this)").attr('data','{"action":"joined","data":{}}');
					 
					 //update tags
					 if(profile_info.update_i == 1){
						 var tags = profile_info.tags.split(',');
						 var update = '';
						 
						 $(html).find('div.tags').find('span').each(function(){
							if(!$(this).hasClass('location') && !$(this).hasClass('comment'))
							if(tags.indexOf($(this).text().replace('#','')) < 0)
							  update = update + ','+$(this).text().replace('#','').trim();
						 });
						 profile_info.tags += update;
						 if(update.length > 1){ //update database and delete redis cache
						   post({action:'update_tags',id : profile_info.id, tags: update}, function(response){
							  console.log(response); 
						   });	 
						 }	 
					 }
					 //console.log(html.wrap('<div>').parent().html());
					 return html;					 
				   
				  break;
				  
				  case 'options':
				   
					var update_i = data.update_i ?  'checked'  : '';
					var live_not = data.live_not ?  'checked'  : '';
				    
				    return "<form class='edit_profile'>" +
					           "<div style='width:100%'><span style='float:right;width:100px;display:block;'><input type='checkbox' " + update_i   + " style='position:relative;top:-7px' name='auto_update_interests' /></span> Auto update interests </div>"+
							   "<div style='width:100%;margin-top:10px;'><span style='float:right;width:100px;display:block;'> <input type='checkbox'  " + live_not   + "  style='position:relative;top:-7px' name='live_notifications' /></span> Live notifications </div>"+
					           "<input type='text' name='name' value='" + data.name + "'/>" +
							   "<input type='text' name='facebook' value='" + data.facebook + "' />"+
							   "<input type='text' name='tags' value='" + data.tags + "'/>"+
							   "<button class='save_settings'>Save Settings</button>"
							"</form>";
							
				  break;
				  
				  case 'profile':
				  
				    return "<div class='profile'>"
					          +"<img src='' />"
							  +"<span>" + data.title + "</span>"
					       +"</div>"
						   
				  break;
			  }
		  }
			
		}
	}
	 
	 
	//get primary content
	var reload_content = function(){
      get({action : 'get_content' , id : profile_info.id, tags: profile_info.tags}, function(response){
		
		if(response.status == 'done'){ //na, acu-i acu ...
			
			//clear old posts
			$('article').each(function(){
				if(!$(this).hasClass('start')){
					$(this).remove();
				}
			});
			 
		    //add posts
			for(var a in response.rows){
				if(typeof response.rows[a] !== 'undefined'){
				   	$('section.content').append(ui_functions.render_event(response.rows[a]));
				}
			}
			console.log(response.user);
			//add user informations
			profile_info.tags = response.user.tags;
			profile_info.name = response.user.name;
			profile_info.update_i = response.user.auto_update_interests;
			profile_info.live_not = response.user.live_notifications;
		
		}
		
		//hai ca nu o fost asa greu
	
	  });
    };
	reload_content();
	
	/*====================================================== Jquery Plugins ===============*/
    var $map = $('div#right_map');
    console.log($map);
    var placepicker = $('input#advanced-placepicker').placepicker({
       map: $map.get(0),
       placeChanged: function(place) {
            console.log("place changed: ", place.formatted_address, this.getLocation());
       }
     }).data('placepicker');

	//add jquery time plugin to time input
	$('input#time_start').timepicki();
	 
	 
	/*=========================================================== listeners =================*/
	$(document).on('click','button.open_event', function(){
		if($(this).hasClass('hidden')){
		  $('section.add_section').css({'margin-top': '60px'})
	      $(this).removeClass('hidden');
		}else{
		  $('section.add_section').css({'margin-top': '-300px'})
	      $(this).addClass('hidden');	
		}
	});
	
	
	
	$(document).on('click', 'div#overlay', function(e){
		
		if($(e.target).is($('div#overlay')))
		 ui_functions.overlay_hide();
	});
	
	
	
	$(document).on('click','button.save_settings', function(event){
		event.preventDefault();
		var $saved = $(this);
		var obj = {
			action : 'save_profile',
			id : profile_info.id
		}
		var empty = 0;
		$('form.edit_profile').find('input').each(function(){
			var index = $(this).attr('name');
			var val = $(this).val();
			
			if(index == 'live_notifications')
			  if($(this).is(':checked')) val = 1;
			  else val  = 0;
			
			if(index == 'auto_update_interests')
			  if($(this).is(':checked')) val = 1;
			  else val  = 0;
			  
			
			if(val.toString().length >= 1){
				obj[index] = val;
			}else{
				empty = 1;
				return;
			}
		});
		

		if(empty == 1){
			$saved.text('Complete all forms');
		    return;
	 	}
		console.log(obj);
		//update profile informations
		profile_info.update_i = obj.auto_update_interests;
		profile_info.live_not = obj.live_notifications; 
		profile_info.tags = obj.tags;
		
		$saved.text('Loading..');

		post(obj, function(response){
			if(response.status == 'done')
				$saved.text('Done');
			else
				$saved.text('Error');
		});
	});
	
	
	
	$(document).on('click','button.add_event', function(event){
		event.preventDefault();
		
		var $saved = $(this);
		var obj = {
			action : 'add_event',
			user_id : profile_info.id
		}
		var empty = 0;
		$('form.add_event').find('input').each(function(){
			var index = $(this).attr('name');
			var val = $(this).val();
			
			if(val.toString().length >= 1){
				obj[index] = val;
			}else{
				empty = 1;
				return;
			}
		});
		
		obj.description = $('textarea[name=description].event').val();
		
		obj.adress = $('input#advanced-placepicker').val();
		
		if(obj.adress.length < 3 || obj.description.length < 3) empty = 1;
		
		if(empty == 1){
			$saved.text('Complete all forms');
		    return;
	 	}
		
		$saved.text('Loading..');

		post(obj, function(response){
			if(response.status == 'done'){
				$saved.text('Done');
				setTimeout(function(){
					$('button.reload').trigger('click');
					$('button.oppen_event').trigger('click');
				},1500);
			}
			else
				$saved.text('Error');
		});
	});
	
	$(document).on('click','button.join',function(){
		
		var obj = {
			action : 'join',
			id : $(this).attr('data-id'),
			my_id : profile_info.id,
			serial : JSON.stringify(profile_info)
		}
		
		post(obj, function(response){
			console.log(response);
		});
		
	});
	
	$(document).on('click','button.unjoin', function(){
		
        localStorage['joined'] = '';
		
		$('article').each(function(){
			if(!$(this).find('button.join').hasClass('expired'))
			  $(this).find('button.join').show();
		});
		
		$('button.joined').removeClass('joined').addClass('open_event').addClass('hidden').removeAttr('onclick').text('+ Event');
		
		ui_functions.overlay_hide();
		
		var obj = {
			action : 'unjoin',
			id : $(this).attr('data-id'),
			my_id : profile_info.id,
			serial : JSON.stringify(profile_info)
		}
		
		post(obj, function(response){
			console.log(response);
		});
		
	});
	
	$(document).on('click','button.send_comment', function(){
		
		var obj = {
			action : 'send_comment',
			my_id : profile_info.id,
			id : $('button.unjoin').attr('data-id'),
			comment : $('textarea.comments').val()
		}
		
		var $saved = $(this);
		
		if(obj.comment.length < 1){
			$saved.text('Comment too short');
			return;
		}
		
		$saved.text('Loading..');
		
		if(localStorage['commented_on'].search(','+obj.id) > -1)
	    {
			$saved.text('You already have a comment');
			return;
		}
		
		post(obj, function(response){
		   if(response.status == 'done'){
			   localStorage['commented_on'] += ',' + obj.id;
			   $saved.text('Done');
			   var $c_holder = $('div.comments_holder');
			   $c_holder.find('span.no_comments').remove();
			   $c_holder.append(ui_functions.render_comment({comment_id:response.id,user_id: profile_info.id, name: profile_info.name, text: obj.comment}));
		   }else{
			   $saved.text('Error');
		   }
		});
	});
	
	$(document).on('click','span.delete_comm', function(){
		$(this).addClass('sure');
		$(this).text('Sure?');
	});
	
	$(document).on('click','span.delete_comm.sure', function(){
		
		var obj = {
			action : 'delete_comm',
			comm_id : $(this).attr('data'),
			user: profile_info.id
		}
		
		var $saved = $(this);
		$saved.text('Loading');
		
		post(obj, function(response){
			if(response.status == 'done'){
				$saved.parent('span').parent('div.comm').remove();
				localStorage['commented_on'] = localStorage['commented_on'].replace(","+$('button.unjoin').attr('data-id'), '');
			}
		});
	});
	
	//reload
	$(document).on('click','button.reload', function(){
		
		reload_content();
		
	});
	
 });