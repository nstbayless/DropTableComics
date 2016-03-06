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
})
.value('$anchorScroll', angular.noop)
.run(['$anchorScroll', function($anchorScroll) {
    $anchorScroll = angular.noop;
}])
