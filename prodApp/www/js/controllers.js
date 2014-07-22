
angular.module('starter.controllers', ['ngCookies'])

.controller('LoginCtrl', function($scope, $location, $cookieStore, $http, cssInjector, User, Api){
	if(
		$cookieStore.get("username") != undefined &&
		$cookieStore.get("password") != undefined &&
		$cookieStore.get("roleid") != undefined &&
		$cookieStore.get("authenticated") == "true"
	){
		$location.path('/' + $cookieStore.get("username") + '/jobs');
	}

	cssInjector.removeAll();
	cssInjector.add('/css/login.css');    
	$scope.logindata = {};
	

	if($cookieStore.get("username") != undefined)
		$scope.logindata.username = $cookieStore.get("username");
	if($cookieStore.get("password") != undefined)
		$scope.logindata.password = $cookieStore.get("password");
	if($cookieStore.get("roleid") != undefined)
		$scope.logindata.roleid = $cookieStore.get("roleid");

	Api.getRoles().then(function(response){
		$scope.roles = response.data;
	});

	$scope.login = function(){
		var username = $scope.logindata.username;
		var password = $scope.logindata.password;
		var roleid = $scope.logindata.roleid;
		if(username == undefined || password == undefined || roleid == undefined){
			$scope.logindata.alert = "Error: Incomplete Authentication Information";
			$scope.logindata.username ;
			return;
		}
		var user = User.getUserByName(username);

		// var user = null;
		// var result;
		// Api.getAllStaff().then(function(data, result){alert(data.data.length);result = data.data.length};);
		// alert(result);
		// Api.getStaffByName(username);
		// .then(function(response){
		// 	$scope.user = response.data;
		// });

		if(user != null){
			$cookieStore.put("username", username);
			$cookieStore.put("password", password);
			$cookieStore.put("roleid", user.role);
			$cookieStore.put("authenticated", "true");

			$location.path('/' + username + '/jobs');
		}
		else
			$scope.logindata.alert = "Error: Incorrect Authentication Information";
	};

	$scope.clearCookies = function(){
		$cookieStore.remove("username");
		$cookieStore.remove("password");
		$cookieStore.remove("roleid");
		$cookieStore.remove("authenticated");
		$scope.logindata.username = $cookieStore.get("");
		$scope.logindata.password = $cookieStore.get("");
		$scope.logindata.roleid = $cookieStore.get("");
	}
})

.controller('OverviewCtrl', function($scope, $stateParams, $cookieStore, cssInjector, User, Jobs, Account, Api){
	cssInjector.removeAll();
	cssInjector.add('/css/overview.css');

	Api.getStaffByName($stateParams.username).then(function(response){
		$scope.user = response.data;
	});

	Api.getJobByStaff($scope.user.id).then(function(response){
		$scope.jobs = response.data;
	});

	// $scope.user = User.getUserByName($stateParams.username);
	// Api.getJobByStaff()
	// $scope.jobs = Jobs.all();
	$scope.orderProp = '';

	$scope.$logoff = Account;

	//function to go to overview page
	$scope.$overview = Account;
})

.controller('JobviewCtrl', function($scope, $stateParams, $cookieStore, cssInjector, User, Jobs, Account){
	cssInjector.removeAll();
	cssInjector.add('/css/jobview.css');
	var job = Jobs.get($stateParams.jobId);
	var user = User.getUserByName($cookieStore.get("username"));
	$scope.user = user;
	$scope.job = job;
	$scope.previews = job.print_location;
	if(user.role != "Manager"){
		$scope.NonManagerDiv = "/templates/" + NON_MANAGER_DIV + ".html";
	}
	else{
		$scope.preps = User.getUsersByRole(ROLES[0]);
		$scope.printers = User.getUsersByRole(ROLES[1]);
		$scope.ManagerDiv = "/templates/" + MANAGER_DIV + ".html";
		$scope.assignee = {};
		$scope.assign = function(){
			if($scope.assignee.prep == undefined || $scope.assignee.printer == undefined){
				$scope.alert = "Incomplete Info";
			}
		}
	}
	if(user.role == "Printer"){
		$scope.PrinterDiv = "/templates/" + PRINTER_DIV + ".html";
	}
	
	//Tag to mark if a location is being printing. If so, the user can't select other printer location.
	$scope.processing = false;

	//funciton to select printer location
	$scope.selectedLocation = function(img, location){
		if($scope.processing)
			return;
		$scope.selectedImg = img;
		$scope.selectedImgSrc = "/img/jobs/" + $stateParams.jobId + "/" + location + ".jpg";
		$scope.largePreviewText = location + " is not included in the design";
	}

	//function to process a printer location, and other locations can't be selected.
	$scope.movetoNext = function(){
		$scope.processing = true;
	}

	$scope.printNN = function(){
		$scope.processing = true;
	}

	//function to log off
	$scope.$logoff = Account;	

	//function to go to overview page
	$scope.$overview = Account;
});

var ROLES = ["Prep", "Printer", "QC", "Manager"];
var NON_MANAGER_DIV = "NonManagerDiv";
var MANAGER_DIV = "ManagerDiv";
var PRINTER_DIV = "PrinterDiv";