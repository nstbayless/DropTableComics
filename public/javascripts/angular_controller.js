//handles client-side authentication

//milliseconds to wait before redirecting
var REDIRECT_TIMEOUT=200;

var app = angular.module('authentication', [])
app.controller('authController', function($scope, $http, $timeout) {
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

		$scope.mouseover_panel=-1;
		//user mouses over panel
		$scope.mouseover=function(panel){
			$scope.mouseover_panel=panel;
		}
		//user's mouse leaves panel
		$scope.mouseleave=function(panel){
			var x=event.x;
			var y=event.y;
			var box = $scope.boxgetattr();
			if ($scope.mouseover_panel==panel || panel==-1)
				if (x<box.left||y<box.top||x>box.left+box.width||y>box.top+box.height)
					$scope.mouseover_panel=-1;
		}
		$scope.boxgetattr=function(){
			if ($scope.mouseover_panel==-1)
				return {width: 0, height: 0, left: 0, top: 0}
			else {
				var img_elem = document.getElementById('panel'+$scope.mouseover_panel);
				return img_elem.getBoundingClientRect();
			}
		}
		$scope.movepanel=function(panel, dst){
			if (dst<0)
				return;

			var panel_move = $scope.draft.panels[panel];
			$scope.draft.panels.splice(panel,1);
			$scope.draft.panels.splice(dst,0,panel_move);
				
			block_update=true;

			$http.put("draft/json", {
				draft:$scope.draft
			}).then(function(response){
				block_update=true;
			}, function errorCallback(response) {
 	     if (response.data.msg)
					$scope.response = response.data.msg
		  })

			$scope.mouseover_panel=-1;
		}
		$scope.deletepanel=function(panel){
			$scope.draft.panels.splice(panel,1);

			block_update=true;

			$http.put("draft/json", {
				draft:$scope.draft
			}).then(function(response){
				block_update=true;
			}, function errorCallback(response) {
 	     if (response.data.msg)
					$scope.response = response.data.msg
		  })

			$scope.mouseover_panel=-1;
		}
	}
})
.value('$anchorScroll', angular.noop)
.run(['$anchorScroll', function($anchorScroll) {
    $anchorScroll = angular.noop;
}])
