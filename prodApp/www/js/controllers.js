
angular.module('starter.controllers', [])

.controller('LoginCtrl', function($scope, cssInjector){
	cssInjector.removeAll();
	cssInjector.add('/css/login.css');    
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