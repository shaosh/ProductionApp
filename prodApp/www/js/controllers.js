
angular.module('starter.controllers', [])

.controller('LoginCtrl', function($scope, cssInjector){
	cssInjector.add('/css/login.css');    
})

.controller('OverviewCtrl', function($scope, $stateParams, cssInjector, User, Jobs){
	cssInjector.add('/css/overview.css');
	$scope.user = User.get($stateParams.userId);
	$scope.jobs = Jobs.all();
	$scope.orderProp = '';
})

.controller('JobviewCtrl', function($scope, $stateParams, cssInjector, Jobs){
	cssInjector.add('/css/jobview.css');
	var job = Jobs.get($stateParams.jobId);
	$scope.job = job;//Jobs.get($stateParams.jobId);
	$scope.previews = job.print_location;
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


