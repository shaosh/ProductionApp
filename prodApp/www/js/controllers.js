
angular.module('starter.controllers', ['ngCookies'])

.controller('LoginCtrl', function($scope, $location, $cookieStore, cssInjector, User){
	if(
		$cookieStore.get("username") != undefined &&
		$cookieStore.get("password") != undefined &&
		$cookieStore.get("roleid") != undefined &&
		$cookieStore.get("authenticated") == "true"
	){
		$location.path('/user/0');
	}

	cssInjector.removeAll();
	cssInjector.add('/css/login.css');    
	$scope.logindata = {};




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
		if(user != null){
			$cookieStore.put("username", username);
			$cookieStore.put("password", password);
			$cookieStore.put("roleid", roleid);
			$cookieStore.put("authenticated", "true");

			$location.path('/user/' + user.id);
		}
		else
			$scope.logindata.alert = "Error: Incorrect Authentication Information";
	};
})

.controller('OverviewCtrl', function($scope, $stateParams, cssInjector, User, Jobs){
	cssInjector.removeAll();
	cssInjector.add('/css/overview.css');
	$scope.user = User.get($stateParams.userId);
	$scope.jobs = Jobs.all();
	$scope.orderProp = '';
})

.controller('JobviewCtrl', function($scope, $stateParams, cssInjector, User, Jobs){
	cssInjector.removeAll();
	cssInjector.add('/css/jobview.css');
	var job = Jobs.get($stateParams.jobId);
	var user = User.get($stateParams.userId);
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
	}
	if(user.role == "Printer"){
		$scope.PrinterDiv = "/templates/" + PRINTER_DIV + ".html";
	}
	

	$scope.selectedLocation = function(img, location){
		$scope.selectedImg = img;
		$scope.selectedImgSrc = "/img/jobs/" + $stateParams.jobId + "/" + location + ".jpg";
		$scope.largePreviewText = location + " is not included in the design";
	}
	// $scope.$watch($('#previewdiv img').click(
	// 		function(){
	// 			$('#previewdiv img').removeClass('highlighted');
	// 			$(this).addClass('highlighted');
	// 		}
	// 	)

	// );

	// $scope.user = User.get($stateParams.userId);
	// $scope.jobs = Jobs.all();
	// $scope.orderProp = '';
});

var ROLES = ["Prep", "Printer", "QC", "Manager"];
var NON_MANAGER_DIV = "NonManagerDiv";
var MANAGER_DIV = "ManagerDiv";
var PRINTER_DIV = "PrinterDiv";