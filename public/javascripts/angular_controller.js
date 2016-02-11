//handles client-side authentication

var app = angular.module('authentication', [])
app.controller('authController', function($scope, $http) {
	//read http headers: 
	var req = new XMLHttpRequest();
	req.open('GET', document.location, false);
	req.send(null);
	console.log(req.getAllResponseHeaders());

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
				window.location='/';
			else if (response.data.msg)
				$scope.response=response.data.msg
		}, function errorCallback(response) {
      if (response.data.msg)
				$scope.response = response.data.msg
	  }) 
	}
	
	//user attempts to create a new comic
	$scope.create_comic=function(){
		$scope.response=""
		$http.post("/pretty/comic", {
			comic_name: $scope.comic_name,
			description: $scope.comic_description
		}).then(function(response){
			if (response.data.success)
				window.location=response.data.comic_url;
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
				window.location='';
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
		$scope.response=""
		$http.post('/pretty/adminpage', {
			editor: $scope.editor_input
		}).then(function(response){
			if (response.data.success) {//redirect to current page
				window.location='';
				console.log("successfully redirected");
			}
			else if (response.data.msg) {
				$scope.response = response.data.msg
				console.log("did not redirect");
			}
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
				window.location='/';
			else if (response.data.msg)
				$scope.response = response.data.msg
		}, function errorCallback(response) {
      if (response.data.msg)
				$scope.response = response.data.msg
	  }) 
	}

	//log user out by deleting credential cookie
	$scope.logout=function(){
		$http.get("/auth/logout");
		window.location='/';
	}

	//sanitize uri for comic (Identical to Comic.sanitizeName()):
	$scope.sanitizeName=function(name) {
		if (!name)
			return ""
		return name
						.replace(/[ _*&\^@\/\\]+/g,'-') //swap space-like characters for dash
						.replace(/[^a-zA-Z0-9\-]/,'') //remove bad characters
  }
})
.value('$anchorScroll', angular.noop)
.run(['$anchorScroll', function($anchorScroll) {
    $anchorScroll = angular.noop;
}])
