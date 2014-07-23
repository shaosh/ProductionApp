
angular.module('starter.controllers', ['ngCookies', 'ngResource', 'LocalStorageModule'])

.controller('LoginCtrl', function($scope, $location, $cookieStore, localStorageService, cssInjector, User, Account, Api){
	if(
		// $cookieStore.get("username") != undefined &&
		$cookieStore.get("user") != undefined &&
		$cookieStore.get("password") != undefined &&
		// $cookieStore.get("roleid") != undefined &&
		$cookieStore.get("authenticated") == "true"
	){
		$location.path('/' + $cookieStore.get("user").name + '/jobs');
	}

	cssInjector.removeAll();
	cssInjector.add('/css/login.css');    
	$scope.logindata = {};
	

	// if($cookieStore.get("username") != undefined)
	// 	$scope.logindata.username = $cookieStore.get("username");
	if($cookieStore.get("user") != undefined){
		$scope.logindata.username = $cookieStore.get("user").name;
		$scope.logindata.roleid = $cookieStore.get("user").role_id;
	}
		
	if($cookieStore.get("password") != undefined)
		$scope.logindata.password = $cookieStore.get("password");
	// if($cookieStore.get("roleid") != undefined)
	// 	$scope.logindata.roleid = $cookieStore.get("roleid");

	// $scope.roles = Api.getRoles().query();
	$scope.roles = Api.getData("roles").query();

		// function(response){
		// 	angular.forEach(response, function(item){
		// 	});
		// }
	// );

	// $scope.roles = Api.getRoles();
	// Api.getRoles().then(function(response){
	// 	$scope.roles = response.data;
	// });

	$scope.login = function(){
		var username = $scope.logindata.username;
		var password = $scope.logindata.password;
		var roleid = $scope.logindata.roleid;
		var rolename = $scope.roles[roleid].name;//$scope.logindata.rolename;
		if(username == undefined || password == undefined || roleid == undefined){
			$scope.logindata.alert = "Error: Incomplete Authentication Information";
			return;
		}

		Api.getData("staffs").query(function(data){
			var user = Api.getStaffByName(username, data);
			if(user != null && roleid == user.role_id){
				Account.login(user, password, rolename);

				localStorageService.clearAll();
				localStorageService.set("roles", $scope.roles);
				var constants = ["locations", "facilities", "logstatuses", "printstatuses"];
				angular.forEach(constants, function(constant){
					Api.getData(constant).query(function(data){
						localStorageService.set(constant, data);
					});
				});
				// $cookieStore.put("user", user);
				// $cookieStore.put("password", password);
				// $cookieStore.put("rolename", rolename);
				// $cookieStore.put("authenticated", "true");
				// $cookieStore.put("roles", $scope.roles);
				// $location.path('/' + username + '/jobs');
			}
			else
				$scope.logindata.alert = "Error: Incorrect Authentication Information";
			}
		);
		

		// Api.getStaffByName(username).then(function(response){
		// 	if(response.name != undefined){
		// 		$cookieStore.put("username", username);
		// 		$cookieStore.put("userid", response.id);
		// 		$cookieStore.put("password", password);
		// 		$cookieStore.put("facilityid", response.facility_id);
		// 		$cookieStore.put("roleid", response.role_id);
		// 		$cookieStore.put("rolename", rolename);
		// 		$cookieStore.put("authenticated", "true");
		// 		$location.path('/' + username + '/jobs');
		// 	}
		// 	else
		// 		$scope.logindata.alert = "Error: Incorrect Authentication Information";
		// });

		

		// if(user != null){
		// 	$cookieStore.put("username", username);
		// 	$cookieStore.put("password", password);
		// 	$cookieStore.put("roleid", user.role);
		// 	$cookieStore.put("authenticated", "true");
		// 	alert(1);
		// 	$location.path('/' + username + '/jobs');
		// }
		// else
		// 	$scope.logindata.alert = "Error: Incorrect Authentication Information";
	};

	$scope.clearCookies = function(){
		// $cookieStore.remove("username");
		$cookieStore.remove("user");
		$cookieStore.remove("password");
		// $cookieStore.remove("roleid");
		$cookieStore.remove("authenticated");

		// $cookieStore.remove("userid");
		// $cookieStore.remove("facilityid");
		$cookieStore.remove("rolename");

		$scope.logindata.username = $cookieStore.get("");
		$scope.logindata.password = $cookieStore.get("");
		$scope.logindata.roleid = $cookieStore.get("");
	}
})

.controller('OverviewCtrl', function($scope, $stateParams, $cookieStore, cssInjector, Helpers, Account, Api){
	cssInjector.removeAll();
	cssInjector.add('/css/overview.css');

	// $cookieStore.remove("username");
	// $cookieStore.remove("password");
	// $cookieStore.remove("roleid");
	// $cookieStore.remove("authenticated");

	$scope.user = $cookieStore.get("user");
	$scope.rolename = $cookieStore.get("rolename");
	$scope.orderProp = '';
	$scope.isOverview = false;
	$scope.$logoff = Account;
	$scope.$overview = Account;

	Api.getData("jobs").query(function(data){
			$scope.jobs = [];
			angular.forEach(data, function(job){
				if(Helpers.facilityIdCompare($scope.user, job)){
					$scope.jobs.push(job);
				}
			});
		}
	);

	//$http version
	// Api.getJobByStaff($scope.user.id).then(function(response){
	// 	$scope.jobs = response.data;
	// });

	// Api.getStaffByName($stateParams.username).then(function(response){
	// 	alert(response.id);
	// 	$scope.user = response;

	// 	Api.getJobByStaff($scope.user.id).then(function(response){
	// 		$scope.jobs = response.data;
	// 	});

	// 	// $scope.user = User.getUserByName($stateParams.username);
	// 	// Api.getJobByStaff()
	// 	// $scope.jobs = Jobs.all();
	// 	$scope.orderProp = '';

	// 	$scope.$logoff = Account;

	// 	//function to go to overview page
	// 	$scope.$overview = Account;
	// });

	// Api.getJobByStaff($scope.user.id).then(function(response){
	// 	$scope.jobs = response.data;
	// });

	// // $scope.user = User.getUserByName($stateParams.username);
	// // Api.getJobByStaff()
	// // $scope.jobs = Jobs.all();
	// $scope.orderProp = '';
})

.controller('JobviewCtrl', function($scope, $stateParams, $cookieStore, localStorageService, cssInjector, Helpers, Account, Api){
	cssInjector.removeAll();
	cssInjector.add('/css/jobview.css');
	var user = $cookieStore.get("user");	
	var roles = localStorageService.get("roles");

	$scope.user = user;
	$scope.rolename = $cookieStore.get("rolename");
	$scope.isOverview = true;
	//function to log off
	$scope.$logoff = Account;	
	//function to go to overview page
	$scope.$overview = Account;

	//Code which depends on the job variable
	//Fetch the specific job based on its job id.
	Api.getData("jobs").query(function(data){
		for(var i = 0; i < data.length; i++){
			if(data[i].id == $stateParams.jobId){
				job = data[i];
				break;
			}
		}
		$scope.job = job;
		$scope.previews = job.location;

		if($scope.rolename != roles[3].name){
			$scope.NonManagerDiv = "/templates/" + NON_MANAGER_DIV + ".html";
		}
		else{
			// alert(3);
			Api.getData("staffs").query(function(data){
				$scope.preps = [];
				$scope.printers = [];
				// alert(4);
				angular.forEach(data, function(staff){
					// alert(5);
					// alert(staff.role_id + ":" + roles[0].id);
					// alert(Helpers.selectStaffByFacility(user, staff));
					if(staff.role_id == roles[0].id && Helpers.facilityIdCompare(staff, job)){
						// alert(staff.name);
						$scope.preps.push(staff);
					}
					else if(staff.role_id == roles[1].id && Helpers.facilityIdCompare(staff, job)){
						// alert(staff.name);
						$scope.printers.push(staff);
					}
					// alert(6);
				});
			});
			$scope.ManagerDiv = "/templates/" + MANAGER_DIV + ".html";
			$scope.assignee = {};
			$scope.assign = function(){
				if($scope.assignee.prep == undefined || $scope.assignee.printer == undefined){
					$scope.alert = "Incomplete Assignment";
				}
			}
		}
		if(user.role_id == roles[1].id){
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
	});

	//Code to execute after the job is fetched
	// $scope.$watch('job', function(){
	// 	var job = $scope.job;
	// 	alert(job.name);
	// 	alert(job.facility_id);
	// 	$scope.alert = $scope.job.name;
	// });
	
	// if($scope.rolename != roles[3].name){
	// 	$scope.NonManagerDiv = "/templates/" + NON_MANAGER_DIV + ".html";
	// }
	// else{
	// 	Api.getData("staffs").query(function(data){
	// 		$scope.preps = [];
	// 		$scope.printers = [];
	// 		angular.forEach(data, function(staff){
	// 			if(staff.role_id = roles[0].id)
	// 				$scope.preps.push(staff);
	// 			else if(staff.role_id = roles[1].id)
	// 				$scope.printers.push(staff);
	// 		});
	// 	});
	// 	$scope.ManagerDiv = "/templates/" + MANAGER_DIV + ".html";
	// 	$scope.assignee = {};
	// 	$scope.assign = function(){
	// 		if($scope.assignee.prep == undefined || $scope.assignee.printer == undefined){
	// 			$scope.alert = "Incomplete Assignment";
	// 		}
	// 	}
	// }
	// if(user.role_id == roles[1].id){
	// 	$scope.PrinterDiv = "/templates/" + PRINTER_DIV + ".html";
	// }
	
	// //Tag to mark if a location is being printing. If so, the user can't select other printer location.
	// $scope.processing = false;

	// //funciton to select printer location
	// $scope.selectedLocation = function(img, location){
	// 	if($scope.processing)
	// 		return;
	// 	$scope.selectedImg = img;
	// 	$scope.selectedImgSrc = "/img/jobs/" + $stateParams.jobId + "/" + location + ".jpg";
	// 	$scope.largePreviewText = location + " is not included in the design";
	// }

	// //function to process a printer location, and other locations can't be selected.
	// $scope.movetoNext = function(){
	// 	$scope.processing = true;
	// }

	// $scope.printNN = function(){
	// 	$scope.processing = true;
	// }


});

var ROLES = ["Prep", "Printer", "QC", "Manager"];
var NON_MANAGER_DIV = "NonManagerDiv";
var MANAGER_DIV = "ManagerDiv";
var PRINTER_DIV = "PrinterDiv";