//handles client-side authentication

//milliseconds to wait before redirecting
var REDIRECT_TIMEOUT=200;

var app = angular.module('authentication', [])
app.controller('authController', function($location, $scope, $http, $timeout) {
	//read http headers:
	var req = new XMLHttpRequest();
	req.open('GET', document.location, false);
	req.send(null);
	console.log(req.getAllResponseHeaders());
	$scope.confirmdelete=false;
	$scope.el = {}; $scope.vl = {}; $scope.al = {};
	$scope.editmode=/edit\/?$/.test(window.location);

	//true if logged in
	$scope.authenticated = req.getResponseHeader("authenticated")=="true"
	//username (if registered and logged in)
	$scope.username = req.getResponseHeader("username")
	//true only if user is artist
	$scope.isartist = req.getResponseHeader("isartist")=="true"

	//user attempts to register a new account
	$scope.register=function(){
		$scope.response=""
		if ($scope.auth_password!=$scope.auth_password_confirm){
			$scope.response="passwords must match!"
			return;
		}
		$http.post("/auth/accounts", {
			username: $scope.auth_username,
			password: $scope.auth_password,
			email: $scope.auth_email,
			account_type: $scope.auth_usertype
		}).then(function(response){
			if (response.data.success) //redirect to dashboard
				$timeout(function(){window.location='/';},REDIRECT_TIMEOUT)
			else if (response.data.msg)
				$scope.response=response.data.msg
		}, function errorCallback(response) {
      if (response.data.msg)
				$scope.response = response.data.msg
	  })
	}

	//user attempts log-in
	$scope.login=function(){
		$scope.response=""
		$http.post("/auth/login", {
			username: $scope.auth_username,
			password: $scope.auth_password
		}).then(function(response){
			if (response.data.success) //redirect to dashboard
				$timeout(function(){window.location='/';},REDIRECT_TIMEOUT)
			else if (response.data.msg)
				$scope.response = response.data.msg
		}, function errorCallback(response) {
      if (response.data.msg)
				$scope.response = response.data.msg
	  })
	}

	//user attempts to create a new comic
	$scope.create_comic=function(){
		$scope.response=""
		$http.post("/accounts/" + $scope.username + "/comics", {
			comic_name: $scope.comic_name,
			description: $scope.comic_description
		}).then(function(response){
			if (response.data.success)
				window.location= "/accounts/" + response.data.comic_url;
		}, function errorCallback(response) {
      if (response.data.msg)
				$scope.response = response.data.msg
	  })
	}

	//post page to comic:
	$scope.postPage=function(comic_creator,comic_uri) {
		$scope.response=""
		$http.post("/accounts/" + comic_creator + "/comics/"+comic_uri+"/pages", {
		}).then(function(response){
			$timeout(function(){
					window.location="/accounts/"+comic_creator+"/comics/"
					                +comic_uri+"/pages/"+response.data.new_page_id+"/edit";
				},REDIRECT_TIMEOUT)
		}, function errorCallback(response) {
      if (response.data.msg)
				$scope.response = response.data.msg
	  })
	}

	//delete page from comic:
	$scope.deletePage=function(comic_creator,comic_uri,page) {
		$scope.response=""
		$http.delete("/accounts/" + comic_creator + "/comics/"+comic_uri+"/pages/"+page, {
		}).then(function(response){
			$timeout(function(){
					window.location="/accounts/"+comic_creator+"/comics/"
					                +comic_uri+"/pages/"+(page-1)+"/edit";
				},REDIRECT_TIMEOUT)
		}, function errorCallback(response) {
      if (response.data.msg)
				$scope.response = response.data.msg
	  })
	}

	//publish draft:
	$scope.publishPage=function(comic_creator,comic_uri,page) {
		$scope.response=""
		$http.post("/accounts/" + comic_creator + "/comics/"+comic_uri+"/pages/"+page+"/publish", {
		}).then(function(response){
			$timeout(function(){
					window.location="/accounts/"+comic_creator+"/comics/"
					                +comic_uri+"/pages/"+(page);
				},REDIRECT_TIMEOUT)
		}, function errorCallback(response) {
      if (response.data.msg)
				$scope.response = response.data.msg
	  })
	}

	//user attempts to subscribe
	$scope.subscribe_comic = function(comic_uri){
		$scope.response=""
		debugger;
		$http.post(comic_uri+"/subscribe", {
		}).then(function(response){
			if (response.data.success)
				window.location= '';
		}, function errorCallback(response) {
      if (response.data.msg)
				$scope.response = response.data.msg
	  })
	}

	//user attempts to add user to viewlist
	$scope.viewlist_add=function() {
		$scope.response1=""
		$http.post('', {
			username: $scope.username_input
		}).then(function(response1){
			if (response1.data.success) {//redirect to current page
				window.location.reload();
				console.log("successfully redirected");
			}
			else if (response1.data.msg) {
				$scope.response1 = response1.data.msg
				console.log("did not redirect");
			}
		}, function errorCallback(response1) {
		if (response1.data.msg)
				$scope.response1 = response1.data.msg
		})
	}

	//user attempts to add user to editlist
	$scope.editlist_add=function() {
		$scope.response2=""
		$http.post('', {
			editor: $scope.editor_input
		}).then(function(response2){
			if (response2.data.success) {//redirect to current page
				window.location.reload();
				console.log("successfully redirected");
			}
			else if (response2.data.msg) {
				$scope.response2 = response2.data.msg
				console.log("did not redirect");
			}
		}, function errorCallback(response2) {
		if (response2.data.msg)
				$scope.response2 = response2.data.msg
		})
	}

	//returns list of users to remove from a certain list
	//list can be one of:
	// - "edit"
	// - "view"
	// - "admin"
	$scope.evict_list=function(list) {
		var source_list;
		if (list=="edit")
			source_list=$scope.el;
		else if (list=="view")
			source_list=$scope.vl;
		else if (list=="admin")
			source_list=$scope.al;
		else
			throw "Error, no list for " + list;
		var return_list=[ ];
		for (var user in source_list)
			if (source_list[user])
				return_list.push(user);
		return return_list;
	}

	//revokes permissions from selected usernames from the given list
	// list can be one of:
	// - "edit"
	// - "view"
	// - "admin"
	$scope.evict_users=function(l_users,list) {
		if (list=="view") {
			//TODO: we need a better system for the different responses
			$scope.response1='';
		} else if (list=="edit") {
			$scope.response2='';
		} else if (list=="admin") {
			//TODO
		}

		$http.put('',{
				l_users: l_users,
				relevant_list: list
			}).then(
			function success(response){
				$timeout(function(){
					window.location.reload();
				},REDIRECT_TIMEOUT)
			}, function error(response){
				if (list=="view") {
					$scope.response1=response.data.msg;
				} else if (list=="edit") {
					$scope.response2=response.data.msg;
				} else if (list=="admin") {
					//TODO
				}
			}
		);
	}

	//log user out by deleting credential cookie
	$scope.logout=function(){
		$http.get("/auth/logout");
		$timeout(function(){
			window.location='/';
		},REDIRECT_TIMEOUT)
	}

	//sanitize uri for comic (Identical to Comic.sanitizeName()):
	$scope.sanitizeName=function(name) {
		if (!name)
			return ""
		return name
						.replace(/[ _*&\^@\/\\]+/g,'-') //swap space-like characters for dash
						.replace(/[^a-zA-Z0-9\-]/g,'') //remove bad characters
						.replace(/\-+/g,'-') //condense multiple dashes into one.
 	 }

	$scope.utilrange=function(a,b) {
		r = [];
		for (var i=a;i<b;i++)
			r.push(i);
		return r;
	}

	// ----------- COMMENTS ------------- //
	// comments for viewpage
	$scope.submit_comment=function(comic_creator, comic_uri, page) {
		$scope.response3=""
		console.log("user is attempting to post a comment");
		$http.post("/accounts/" + comic_creator + "/comics/"+comic_uri+"/pages/"+page+"/comment", {
			comment: $scope.comment_input
		}).then(function(response3){
			if (response3.data.success) {
				window.location.reload();
				console.log("successfully redirected");
			}
			else if (response3.data.msg) {
				$scope.response3 = response3.data.msg;
				console.log("did not redirect");
			} else { console.log("Not sure if you're here!!")}

		}, function errorCallback(response3) {
			if (response3.data.msg)
				$scope.response3 = response3.data.msg
		})
	}

	// comments for editpage 
	$scope.submit_editcomment=function(comic_creator, comic_uri, page) {
		$scope.response3=""
		console.log("user is attempting to post a comment");
		$http.post("/accounts/" + comic_creator + "/comics/"+comic_uri+"/pages/"+page+"/edit/comment", {
			comment: $scope.comment_input
		}).then(function(response3){
			if (response3.data.success) {
				window.location.reload();
				console.log("successfully redirected");
			}
			else if (response3.data.msg) {
				$scope.response3 = response3.data.msg;
				console.log("did not redirect");
			} else { console.log("Not sure if you're here!!")}

		}, function errorCallback(response3) {
			if (response3.data.msg)
				$scope.response3 = response3.data.msg
		})
	}

	//  ------------ EDIT MODE FUNCTIONALITY ------------  //

	if ($scope.editmode) {
		var LOAD_DRAFT_TIMEOUT=300;
		var LOAD_DRAFT_ERRMSG = "Error loading draft... slowing load cycle";
		var completed_load=true;

		//Stores information about page for edit mode. (God object.)
		$scope.draft = {title: "", panels: [], edited: false}

		block_update=false;

		//retrieve draft data from server
		var reloaddraft = function(){
			if (!completed_load){
				console.log("error reloading draft");
				$scope.response=LOAD_DRAFT_ERRMSG;
				LOAD_DRAFT_TIMEOUT*=1.5;
			}
			completed_load=false;
			$http.get("draft/json").then(
				function(response) {
					completed_load=true;
					if (block_update) {
						block_update=false;
						return;
					}
					if ($scope.response==LOAD_DRAFT_ERRMSG)
						$scope.response="";
					$scope.draft=response.data.draft;
				}, function (reponse) {
					if (response.msg)
						$scope.response=response.msg;
				}
			)
			$timeout(reloaddraft,LOAD_DRAFT_TIMEOUT);
		}
		reloaddraft();

		//which panel user is hovering over, or -1 if none
		$scope.mouseover_panel=-1;
		//which overlay user is hovering over
		//(at least one of mouseover_panel or mouseover_overlay must be -1)
		$scope.mouseover_overlay=-1;
		//overlay is grabbed (prevents changing selection)
		$scope.overlay_grabbed=false;
		//mouse position at start
		$scope.grabx_init=0;
		$scope.graby_init=0;
		//current mouse position
		$scope.grabx=0;
		$scope.graby=0;

		//user mouses over panel
		$scope.mouseover=function(panel){
			if ($scope.overlay_grabbed) return;
			$scope.mouseover_panel=panel;
			$scope.mouseover_overlay=-1;
		}
		//user mouses over an overlay
		$scope.mouseover_lay=function(overlay){
			if ($scope.overlay_grabbed) return;
			$scope.mouseover_overlay=overlay;
			$scope.mouseover_panel=-1;
		}
		//user's mouse leaves panel or overlay
		//- id: unique id of object (same as in mouseover_overlay or mouseover_panel)
		//- objtype: 'panel' or 'overlay'
		//- e: mouse event (pass in from dispatcher)
		$scope.mouseleave=function(id, objtype,e){
			if ($scope.overlay_grabbed) return;
			var target = e.target || e.srcElement; //Firefox compatibility
			var rect = target.getBoundingClientRect();
			var x=e.x || (e.offsetX+rect.left);
			var y=e.y || (e.offsetY+rect.top);
			if (x==0&&y==0) //required for firefox compatibility. (x,y)==(0,0) is spurious
				//this is a small hack as if the image actually is at (0,0) all events will fail,
				//but as far as I can tell there's no better way to filter out Firefox's garbage.
				//Fortunately, the page html is layed out to make this unlikely or impossible to happen.
				return;
			var box = $scope.boxgetattr();
			if (x<box.left||y<box.top||x>box.left+box.width||y>box.top+box.height) {
				if (($scope.mouseover_panel==id && objtype=="panel") || id==-1)
					$scope.mouseover_panel=-1;
				if (($scope.mouseover_panel==id && objtype=="overlay") || id==-1)
					$scope.mouseover_overlay=-1;
			}
		}

		//bounds overlay position to be in comic border
		boundoverlay=function(id,x,y){
			if (x<-500)
				x=-500;
			if (x>500)
				x=500;
			if (y<0)
				y=0;
			return {x:x,y:y}
		}

		//user's mouse moves over an object
		//this checks to see if any overlay should take priority and switches selection to the overlay instead
		//- id: unique id of object (same as in mouseover_overlay or mouseover_panel)
		//- objtype: 'panel' or 'overlay'
		//- e: mouse event (pass in from dispatcher)
		$scope.mousemove=function(id,objtype,e) {
			var target = e.target || e.srcElement; //Firefox compatibility
			var rect = target.getBoundingClientRect();
			var x=e.x || (e.offsetX+rect.left);
			var y=e.y || (e.offsetY+rect.top);
			if ($scope.overlay_grabbed) {
				$scope.grabx=x;
				$scope.graby=y;
			}
			else {
				//console.log("mousemove: " + x+","+y);
				//find if any overlays overlap
				for (var i=$scope.draft.overlays.length-1;i>=0;i--) {
					var img_elem = document.getElementById('overlay'+i);
					if (!img_elem)
						continue;
					box= img_elem.getBoundingClientRect();
					box_x=box.left;
					box_y=box.top;
					box_w=box.width;
					box_h=box.height;
					if (box_x<x&&box_y<y&&box_x+box_w>x&&box_y+box_h>y) {
						//found an overlay that intersects mouse; switch to select it
						$scope.mouseover_panel=-1;
						$scope.mouseover_overlay=i;
						break;
					}
				}
			}
		}

		//user starts/stops pulling overlay currently selected
		//- e: mouse event (pass in from dispatcher)
		$scope.toggleGrabOverlay=function(e) {
			if ($scope.mouseover_overlay==-1) return;
			$scope.overlay_grabbed=!$scope.overlay_grabbed;
			if (!$scope.overlay_grabbed) {
				//move overlay:
				var x = $scope.draft.overlays[$scope.mouseover_overlay].x;
				x+=$scope.grabx-$scope.grabx_init;
				var y = $scope.draft.overlays[$scope.mouseover_overlay].y;
				y+=$scope.graby-$scope.graby_init;
				pos=boundoverlay($scope.mouseover_overlay,x,y);
				$scope.draft.overlays[$scope.mouseover_overlay].x=pos.x;
				$scope.draft.overlays[$scope.mouseover_overlay].y=pos.y;

				$scope.draft.edited=true;

				$scope.updateServer();
			}

			var target = e.target || e.srcElement; //Firefox compatibility
			var rect = target.getBoundingClientRect();
			var x=e.x || (e.offsetX+rect.left);
			var y=e.y || (e.offsetY+rect.top);
			$scope.grabx_init=$scope.grabx=x;
			$scope.graby_init=$scope.graby=y;
		}

		$scope.getOverlayColourStyle=function() {
			if ($scope.overlay_grabbed)
				return "stroke-width:4;stroke:white;fill:white;fill-opacity:0.33;"
			else
				return "stroke-width:3;stroke:green;fill:green;fill-opacity:0.25;"
		}

		$scope.boxgetattr=function(){
			if ($scope.mouseover_panel!=-1) {
				var img_elem = document.getElementById('panel'+$scope.mouseover_panel);
				return img_elem.getBoundingClientRect();
			}
			if ($scope.mouseover_overlay!=-1) {
				var img_elem = document.getElementById('overlay'+$scope.mouseover_overlay);
				return img_elem.getBoundingClientRect();
			}
			return {width: 0, height: 0, left: 0, top: 0}
		}

		$scope.updateServer=function(){
			block_update=true;
			$http.put("draft/json", {
				draft:$scope.draft
			}).then(function(response){
				block_update=true;
			}, function errorCallback(response) {
 	     if (response.data.msg)
					$scope.response = response.data.msg
		  })
		}
		
		$scope.movepanel=function(panel, dst){
			if (dst<0)
				return;

			var panel_move = $scope.draft.panels[panel];
			$scope.draft.panels.splice(panel,1);
			$scope.draft.panels.splice(dst,0,panel_move);
			$scope.draft.edited=true;

			$scope.updateServer();

			$scope.mouseover_panel=-1;
		}
		$scope.deletepanel=function(panel){
			$scope.draft.panels.splice(panel,1);
			$scope.draft.edited=true;

			$scope.updateServer();

			$scope.mouseover_panel=-1;
		}

		$scope.poppanel=function(panel) {
			var panelID = $scope.draft.panels[panel];
			var decal_obj = {panelID: panelID, x: 0, y: 32};
			$scope.draft.panels.splice(panel,1);
			var o = $scope.draft.overlays;
			if (!(o instanceof Array))
				o=[];
			o.push(decal_obj);
			$scope.draft.overlays=o;
			$scope.draft.edited=true;

			$scope.updateServer();

			$scope.mouseover_panel=-1;
		}

		$scope.deleteoverlay=function(overlay) {
			$scope.draft.overlays.splice(overlay,1);
			$scope.draft.edited=true;

			$scope.updateServer();

			$scope.mouseover_overlay=-1;
		}

		$scope.revertPage=function(){
			$http.delete("draft", {
				draft:$scope.draft
			}).then(function(response){
				$timeout(function(){window.location.reload();},REDIRECT_TIMEOUT)
			}, function errorCallback(response) {
 	     if (response.data.msg)
					$scope.response = response.data.msg
		  })
		}

		$scope.getOverlayPos=function(i){
			//overlay is in place
			var center=document.getElementById('page-area').offsetWidth/2;
			x_offs= $scope.draft.overlays[i].x;
			y_offs= $scope.draft.overlays[i].y;
			if (i==$scope.mouseover_overlay&&$scope.overlay_grabbed) {
				//overlay is being held by user
				x_offs+=$scope.grabx-$scope.grabx_init;	
				y_offs+=$scope.graby-$scope.graby_init;	
			}
			pos=boundoverlay(i,x_offs,y_offs)
			return {x:(pos.x+center),y:pos.y}
		}

		$scope.getOverlayOpacity=function() {
			return 1;
		}
	}
})
.value('$anchorScroll', angular.noop)
.run(['$anchorScroll', function($anchorScroll) {
    $anchorScroll = angular.noop;
}])
