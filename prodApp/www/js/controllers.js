
angular.module('starter.controllers', ['ngCookies', 'ngResource', 'LocalStorageModule'])

.controller('LoginCtrl', function($scope, $location, $cookieStore, localStorageService, cssInjector, Account, Api, Helpers){
	if(
		$cookieStore.get("user") != undefined &&
		$cookieStore.get("password") != undefined &&
		$cookieStore.get("authenticated") == "true"
	){
		$location.path('/' + $cookieStore.get("user").name + '/jobs');
	}

	cssInjector.removeAll();
	cssInjector.add('css/login.css');    
	$scope.logindata = {};
	
	if($cookieStore.get("user") != undefined){
		$scope.logindata.username = $cookieStore.get("user").name;
		$scope.logindata.roleid = $cookieStore.get("user").role_id;
	}

	if($cookieStore.get("password") != undefined)
		$scope.logindata.password = $cookieStore.get("password");

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
			var user = Helpers.getObjectByName(username, data);
			if(user != null && roleid == user.role_id){
				Account.login(user, password, rolename);

				localStorageService.clearAll();
				localStorageService.set("roles", $scope.roles);
				Account.cacheConstants();

				//Store each role and their index in the local storage
				// for(var i = 0; i < $scope.roles.length; i++){
				// 	if($scope.roles[i].name == "Prep")
				// 		localStorageService.set("Prep", $scope.roles[i].id);
				// 	else if($scope.roles[i].name == "Printer")
				// 		localStorageService.set("Printer", $scope.roles[i].id);
				// 	else if($scope.roles[i].name == "QC")
				// 		localStorageService.set("QC", $scope.roles[i].id);
				// 	else if($scope.roles[i].name == "Manager")
				// 		localStorageService.set("Manager", $scope.roles[i].id);
				// }

				
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
		$cookieStore.remove("user");
		$cookieStore.remove("password");
		$cookieStore.remove("authenticated");
		$cookieStore.remove("rolename");

		$scope.logindata.username = "";
		$scope.logindata.password = "";
		$scope.logindata.roleid = "";
	};
})

.controller('OverviewCtrl', function($rootScope, $scope, $stateParams, $cookieStore, cssInjector, localStorageService, Helpers, Account, Api){
	cssInjector.removeAll();
	cssInjector.add('css/overview.css');
	cssInjector.add('css/subheader.css');

	$scope.user = $cookieStore.get("user");
	$scope.rolename = $cookieStore.get("rolename");
	$scope.orderProp = '';
	$scope.isOverview = false;
	$scope.$logoff = Account;
	$scope.$overview = function(){
		$rootScope.overview.query = ""
	}

	//Account;
	//$scope.overview added for query to be updated from input
	if($rootScope.overview == undefined || $rootScope.overview.query != "Pending")
		$rootScope.overview = {};

	//Variable related to the order of the job list
	$scope.reverse = false;
	//Variable related to the pending number showed in the subtitle
	// $rootScope.pendingnum = "";
	//Have to stor the badge number in local storage, otherwise it is incorrect after refresh in the job view page.
	localStorageService.set('pendingnum', "");
	$rootScope.pendingnum = "";
	$rootScope.badgelink = "/#/" + $scope.user.name + "/pendingjobs";

	$scope.reverseOrder = function(){
		$scope.reverse = !$scope.reverse;
	}

	Api.getData("jobs").query(function(data){
		$scope.jobs = [];
		angular.forEach(data, function(job){
			if($scope.user.role_id == localStorageService.get("QC") || $scope.user.role_id == localStorageService.get("Manager")){
				if(Helpers.facilityIdCompare($scope.user, job)){
					//Check the status of each job, and determine if attach the "Pending" badge
					if($scope.user.role_id == localStorageService.get("Manager") && job.log.length == localStorageService.get("Manager_Pending_Log_Count"))
						job.pending = "Pending";
					else if($scope.user.role_id == localStorageService.get("QC") && Helpers.isJobReadyForQC(job))
						job.pending = "Pending";
					else
						job.pending = "";

					//Add the job for the manager
					if($scope.user.role_id == localStorageService.get("Manager"))
						$scope.jobs.push(job);
					//Add the job for the QC only when the job is ready for him
					else if($scope.user.role_id == localStorageService.get("QC") && Helpers.isJobReadyForQC(job))
						$scope.jobs.push(job);
				}
			}
			else{
				if(Helpers.isStaffinJob($scope.user, job)){
					//Check the status of each job, and determine if attach the "Pending" badge
					if($scope.user.role_id == localStorageService.get("Prep") && job.log.length == localStorageService.get("Prep_Pending_Log_Count"))
						job.pending = "Pending";
					else if($scope.user.role_id == localStorageService.get("Printer") && job.log.length == localStorageService.get("Printer_Pending_Log_Count"))
						job.pending = "Pending";
					else
						job.pending = "";
					$scope.jobs.push(job);
				}
			}	

			//Calculate the pending job number in the badge in the subtitle
			if(job.pending != "" && job.pending != undefined){
				// if($rootScope.pendingnum == "")
				// 	$rootScope.pendingnum = 0;
				// $rootScope.pendingnum++;

				// if(localStorageService.get('pendingnum') == "")
				// 	localStorageService.set('pendingnum', 0);
				// var pendingnum = localStorageService.get('pendingnum');
				// localStorageService.set('pendingnum', pendingnum + 1);
				Helpers.incrementPendingnum();
				$rootScope.pendingnum = localStorageService.get('pendingnum');
			}			
		});
		
	});
	$scope.gatherPending = function(){		
		$rootScope.overview.query = "Pending";
	};
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

.controller('JobviewCtrl', function($rootScope, $scope, $stateParams, $cookieStore, $cacheFactory, $location, localStorageService, cssInjector, Helpers, Account, Api){
	cssInjector.removeAll();
	cssInjector.add('css/jobview.css');
	cssInjector.add('css/subheader.css');
	var user = $cookieStore.get("user");	
	var roles = localStorageService.get("roles");
	$rootScope.pendingnum = localStorageService.get('pendingnum');	
	//Clear the overview.query
	$rootScope.overview.query = undefined;

	$scope.user = user;
	$scope.rolename = $cookieStore.get("rolename");
	$scope.isOverview = false;
	//Function to log off
	$scope.$logoff = Account;	
	//Function to go to overview page
	$scope.$overview = function(){
		$location.path('/' + $cookieStore.get('user').name + '/jobs');
	}
	
	//Account;

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
		$scope.previews = [];
		//Generate the small preview image for all locations
		angular.forEach(job.location, function(location){
			var previewname = Helpers.getObjectById(location.location_id, localStorageService.get("locations")).name.toLowerCase();
			if(location.location_id == localStorageService.get("NamesNumbers"))
				var src = "img/namesnums.png";
			else
				var src = "img/jobs/" + job.id + "/" + previewname + ".jpg";
			if(user.role_id == localStorageService.get("Manager") || user.role_id == localStorageService.get("Prep"))
				var isCompleted = true;
			else
				var isCompleted = Helpers.isLocationComplete(user.role_id, location);
			$scope.previews.push({
				"location": location, 
				"src": src,
				"name": previewname,
				"completed": isCompleted
			});
		});
		$scope.facility_name = Helpers.getObjectById(job.facility_id, localStorageService.get("facilities")).name;

		//Generate job logs
		$scope.joblogs = [];
		for(var i = 0; i < job.log.length; i++){
			var logname = Helpers.getObjectById(job.log[i].job_status_id, localStorageService.get("logstatuses")).name;
			var logicon = "";
			if(i != job.log.length - 1 || job.log[i].job_status_id == localStorageService.get("Manager_Completed_Log") || job.log[i].job_status_id == localStorageService.get("Prep_Completed_Log") || job.log[i].job_status_id == localStorageService.get("Printer_Completed_Log"))
				logicon = "ion-checkmark";
			else if( job.log[i].job_status_id == localStorageService.get("QC_Completed_Log"))
				logicon = "ion-checkmark-circled";
			else
				logicon = "ion-arrow-right-a";

			$scope.joblogs.push({
				"name": logname,
				"icon": logicon
			});
		}
		$scope.orderProp = "id";

		//Add the next status button for non-manager users
		if(user.role_id != localStorageService.get("Manager")){
			$scope.UpdateStatusDiv = "/templates/" + NON_MANAGER_DIV + ".html";
			//Find all the job logs based on the user's role
			var logtextlist = [];
			angular.forEach(localStorageService.get("logstatuses"), function(log){
				if(log.role_id == user.role_id){
					logtextlist.push(log);
				}
			});

			//Try to find: for a specific user, which status update is available
			$scope.nextStatusText = ""; 
			if(user.role_id == localStorageService.get("Prep"))
				$scope.validNextStatsus = true;
			else
				$scope.validNextStatsus = false;
			$scope.currentStatus = 0;

			//If the job is already started, how to determine the current status of the job
			if($scope.joblogs.length >= logtextlist[0].id){
				for(var i = 0; i < logtextlist.length; i++){
					var logExisted = false;
					//Find which log of the user is not existed
					for(var j = 0; j < $scope.joblogs.length; j++){
						if($scope.joblogs[j].name == logtextlist[i].name){
							logExisted = true;
							$scope.currentStatus = logtextlist[i].id;
						}
					}
					//Find out which status is the next status
					if(!logExisted && $scope.joblogs.length == logtextlist[i].id){
						if(user.role_id == localStorageService.get("Prep")){
							$scope.nextStatusText = "Move to Next Status: " + logtextlist[i].name;
							//Not change the value of currentStatus here
							//So for prep the currentStatus always starts with 0, which can be used as the index
							//of Prep's logtextlist.
						}
						else if(i == 0 && user.role_id == localStorageService.get("Printer")){
							$scope.nextStatusText = PRINTING_NOT_STARTED;
							i = localStorageService.get("Prep_Completed_Log");
							$scope.currentStatus = i;
						}
						else if(i == 0 && user.role_id == localStorageService.get("QC")){
							$scope.nextStatusText = QC_NOT_COMPLETED;
							i = localStorageService.get("Printer_Completed_Log");
							$scope.currentStatus = i;
						}
						else
							$scope.nextStatusText = logtextlist[i - 1].name;
						break;
					}
				}
				//The job is completed for this user
				if($scope.nextStatusText == ""){
					$scope.nextStatusText = logtextlist[logtextlist.length - 1].name;
					$scope.validNextStatsus = false;
				}
			}

			//The job is not ready for the user
			else{
				if(user.role_id == localStorageService.get("QC") && Helpers.isJobReadyForQC(job)){
					$scope.nextStatusText = QC_NOT_COMPLETED;
					$scope.currentStatus = localStorageService.get("Printer_Completed_Log");
				}
				else
					$scope.nextStatusText = ASSIGNMENT_NOT_READY;
				$scope.validNextStatsus = false;
			}

			//Actually this button is only valid for Prep
			//Here $scope.currentStatus is used as array index which starts from 0
			$scope.movetoNextStatus = function(){
				if(!$scope.validNextStatsus)
					return;
				var logicon = "";
				//Seems the length==5 or 6 will not be invoked here
				// if($scope.joblogs.length == 3 || $scope.joblogs.length == 5)
				//The log to be added is Prep/Printer Complete
				if($scope.joblogs.length == localStorageService.get("Prep_Completed_Log") || $scope.joblogs.length == localStorageService.get("Printer_Completed_Log"))
					logicon = "ion-checkmark";
				else if($scope.joblogs.length == localStorageService.get("logstatuses").length - 1)//6)
					logicon = "ion-checkmark-circled";
				else
					logicon = "ion-arrow-right-a";

				$scope.joblogs.push({
					"name": logtextlist[$scope.currentStatus].name,
					"icon": logicon
				});

				for(var i = 0; i < $scope.joblogs.length - 1; i++){
					$scope.joblogs[i].icon = "ion-checkmark";
				}

				$scope.currentStatus++;
				if($scope.currentStatus < logtextlist.length){
					$scope.nextStatusText = "Move to Next Status:" + logtextlist[$scope.currentStatus].name;

					//$scope.currentStatus here is actually array index. If it is 1, it means the job is just started.
					if(user.role_id == localStorageService.get("Prep") && $scope.currentStatus == 1){
						Helpers.decrementPendingnum();
						$rootScope.pendingnum = localStorageService.get("pendingnum");
					}
				}
				//The job is completed for this user
				else{
					$scope.nextStatusText = logtextlist[logtextlist.length - 1].name;
					$scope.validNextStatsus = false;
				}
			};

			// $scope.validNextStatsus = true;
			//function to process a printer location, and other locations can't be selected.
			// $scope.movetoNextPrintStatus = function(){
			// 	if(!$scope.validNextPrintStatsus)
			// 		return;

			// };
		}
		//Add the assign job button for manager users
		else{
			$scope.preps = [];
			$scope.printers = [];
			var prep = Helpers.findAssignedStaff(localStorageService.get("Prep"), job.staff);
			var printer = Helpers.findAssignedStaff(localStorageService.get("Printer"), job.staff);
			//If this job is already assigned
			if(prep != null && printer != null){
				Api.getData("staffs").query(function(data){				
					angular.forEach(data, function(staff){
						if(staff.id == prep.staff_id){
							$scope.prep = staff;
						}
						else if(staff.id == printer.staff_id){
							$scope.printer = staff;
						}
					});
				});
				$scope.UpdateStatusDiv = "/templates/" + ASSIGNED_MANAGER_DIV + ".html";	
				$scope.assign = function(){
					$scope.alert = "This job has already been assigned";
				};
			}
			//If this job has not been assigned
			else{
				Api.getData("staffs").query(function(data){				
					angular.forEach(data, function(staff){
						if(staff.role_id == localStorageService.get("Prep") && Helpers.facilityIdCompare(staff, job)){
							$scope.preps.push(staff);
						}
						else if(staff.role_id == localStorageService.get("Printer") && Helpers.facilityIdCompare(staff, job)){
							$scope.printers.push(staff);
						}
					});
				});
				
				$scope.assignee = {};
				$scope.assigned = true;
				$scope.assign = function(){
					if($scope.assigned){
						if($scope.assignee.prep == undefined || $scope.assignee.printer == undefined){
							$scope.alert = "Incomplete Assignment";
							return;
						}
						var staffs = [];
						staffs.push(Helpers.getObjectById($scope.assignee.prep, $scope.preps));
						staffs.push(Helpers.getObjectById($scope.assignee.printer, $scope.printers));
						Api.assignStaffs(staffs, job.id);
						
						//Update the job log
						var logstatuses = localStorageService.get("logstatuses");
						var logname = logstatuses[localStorageService.get("Manager_Completed_Log")].name;
						var logicon = "ion-checkmark";
						$scope.joblogs.push({
							"name": logname,
							"icon": logicon
						});

						$scope.alert = "Job assigned";
						//Decrement the badge number
						Helpers.decrementPendingnum();
						$rootScope.pendingnum = localStorageService.get("pendingnum");
						// $rootScope.pendingnum--;
						// if($rootScope.pendingnum == 0)
						// 	$rootScope.pendingnum = "";

						$scope.assigned = false;
					}
					else{
						$scope.alert = "This job has already been assigned";
					}
				};
				$scope.UpdateStatusDiv = "/templates/" + UNASSIGNED_MANAGER_DIV + ".html";
			}			
		}

		//Add the areas specific for printer/QC users
		if(user.role_id == localStorageService.get("Printer") || user.role_id == localStorageService.get("QC")){
			//For printers, always add the change print status button
			$scope.PrinterDiv1 = "/templates/" + PRINTER_DIV1 + ".html";
			//Check if the printer has "Names & Numbers" job
			if(Helpers.hasNamesNumbers(job, localStorageService.get("NamesNumbers"))){
				$scope.PrinterDiv2 = "/templates/" + PRINTER_DIV2 + ".html";
			}

			$scope.movetoNextPrintStatus = function(){
				if(!$scope.validNextPrintStatsus)
					return;
				// $scope.processing = true;
				var printlogList = localStorageService.get("printstatuses");
				var logicon = "ion-checkmark";	
				$scope.currentPrintStatus++;
				if($scope.currentPrintStatus == localStorageService.get("QC_Completed_Regular_PrintLog") || $scope.currentPrintStatus == localStorageService.get("QC_Completed_NN_PrintLog")){
					logicon = "ion-checkmark-circled";
					$scope.validNextPrintStatsus = false;
					//This if seems unnecessary
					// if(user.role_id == localStorageService.get("QC")){
					$scope.nextPrintStatusText = Helpers.getObjectById($scope.currentPrintStatus, localStorageService.get("printstatuses")).name;
					//Decrement the badge if the job is not started for the QC
					if(!Helpers.checkQCStart(job)){
						Helpers.decrementPendingnum();
						$rootScope.pendingnum = localStorageService.get("pendingnum");
					}
					for(var i = 0; i < $scope.previews.length; i++){
						if($scope.previews[i].location.location_id == $scope.currentLocationID){
							$scope.previews[i].completed = true;
						}
					}

					//If all locations are QCed, the job is completed for the QC.
					if(Helpers.checkPrintingComplete(job, user.role_id, $scope.currentLocationID)){
						$scope.currentStatus++;
						$scope.nextStatusText = Helpers.getObjectById($scope.currentStatus, localStorageService.get("logstatuses")).name;
						$scope.joblogs.push({
							"name": $scope.nextStatusText,
							"icon": logicon
						});
					}
					// }
				}
				else if($scope.currentPrintStatus == localStorageService.get("Printer_Completed_Regular_PrintLog") || $scope.currentPrintStatus == localStorageService.get("Printer_Completed_NN_PrintLog")){
					if(user.role_id == localStorageService.get("Printer")){
						$scope.validNextPrintStatsus = false;
						$scope.nextPrintStatusText = Helpers.getObjectById($scope.currentPrintStatus, localStorageService.get("printstatuses")).name;
						
						for(var i = 0; i < $scope.previews.length; i++){
							if($scope.previews[i].location.location_id == $scope.currentLocationID){
								$scope.previews[i].completed = true;
							}
						}

						//If all locations are printed, the job is completed for the printer.
						if(Helpers.checkPrintingComplete(job, user.role_id, $scope.currentLocationID)){
							$scope.currentStatus++;
							$scope.nextStatusText = Helpers.getObjectById($scope.currentStatus, localStorageService.get("logstatuses")).name;
							$scope.joblogs.push({
								"name": $scope.nextStatusText,
								"icon": logicon
							});
							for(var i = 0; i < $scope.joblogs.length - 1; i++){
								$scope.joblogs[i].icon = "ion-checkmark";
							}
						}
					}
				}
				else{
					$scope.nextPrintStatusText = "Move to Next Print Status: " + Helpers.getObjectById($scope.currentPrintStatus + 1, localStorageService.get("printstatuses")).name;
				}
				$scope.printlogs.push({
					"name": Helpers.getObjectById($scope.currentPrintStatus, localStorageService.get("printstatuses")).name,
					"icon": logicon
				});

				if($scope.nextStatusText == PRINTING_NOT_STARTED){
					$scope.currentStatus++;
					$scope.nextStatusText = Helpers.getObjectById($scope.currentStatus, localStorageService.get("logstatuses")).name;
					$scope.joblogs.push({
						"name": $scope.nextStatusText,
						"icon": "ion-arrow-right-a"
					});
					//Decrement badge for Printer
					Helpers.decrementPendingnum();
					$rootScope.pendingnum = localStorageService.get("pendingnum");
				}
			};
		}
		
		//Tag to mark if a location is being printing. If so, the user can't select other printer location.
		// $scope.processing = false;
		//funciton to select printer location
		$scope.selectedLocation = function(img, location){
			// if($scope.processing)
			// 	return;
			$scope.selectedImg = img;
			$scope.selectedImgSrc = location.src;
			$scope.largePreviewText = location.name + " is not included in the design";
			$scope.largePreviewName = location.name;
			$scope.printlogs = [];
			$scope.validNextPrintStatsus = true;
			$scope.currentPrintStatus = -1;
			$scope.currentLocationID = location.location.location_id;
			//Display the print logs
			angular.forEach(location.location.printlog, function(printlog){
				var logicon = "";
				//For any role the job is completed
				if(printlog.print_status_id == localStorageService.get("QC_Completed_Regular_PrintLog") || printlog.print_status_id == localStorageService.get("QC_Completed_NN_PrintLog")){
					logicon = "ion-checkmark-circled";
					$scope.validNextPrintStatsus = false;
					if(user.role_id == localStorageService.get("QC"))
						$scope.nextPrintStatusText = Helpers.getObjectById(printlog.print_status_id, localStorageService.get("printstatuses")).name;
					else if(user.role_id == localStorageService.get("Printer"))
						$scope.nextPrintStatusText = Helpers.getObjectById(printlog.print_status_id - 1, localStorageService.get("printstatuses")).name;
				}
				//For printer the job is completed; for QC, the job is available to start
				else if(printlog.print_status_id == localStorageService.get("Printer_Completed_Regular_PrintLog") || printlog.print_status_id == localStorageService.get("Printer_Completed_NN_PrintLog")){
					logicon = "ion-checkmark";
					if(user.role_id == localStorageService.get("Printer")){
						$scope.validNextPrintStatsus = false;
						$scope.nextPrintStatusText = Helpers.getObjectById(printlog.print_status_id, localStorageService.get("printstatuses")).name;
					}
					else if(user.role_id == localStorageService.get("QC")){
						$scope.validNextPrintStatsus = true;
						$scope.currentPrintStatus = printlog.print_status_id;
						$scope.nextPrintStatusText = "Move to Next Print Status: " + Helpers.getObjectById(printlog.print_status_id + 1, localStorageService.get("printstatuses")).name;						
					}
				}
				//For printer the job can be continued; for QC, the job is not ready.
				else{
					logicon = "ion-checkmark";
					if(user.role_id == localStorageService.get("Printer")){
						$scope.nextPrintStatusText = "Move to Next Print Status: " + Helpers.getObjectById(printlog.print_status_id + 1, localStorageService.get("printstatuses")).name;
						$scope.currentPrintStatus = printlog.print_status_id;
					}
					else if(user.role_id == localStorageService.get("QC")){
						$scope.validNextPrintStatsus = false;
						$scope.nextPrintStatusText = PRINTING_NOT_READY;
					}
				}
				$scope.printlogs.push({
					"name": Helpers.getObjectById(printlog.print_status_id, localStorageService.get("printstatuses")).name,
					"icon": logicon
				});
			});

			//Set the first print status when there is no printlog
			if($scope.printlogs.length == 0){
				if(user.role_id == localStorageService.get("QC")){
					$scope.validNextPrintStatsus = false;
					$scope.nextPrintStatusText = PRINTING_NOT_READY;
				}
				else if(user.role_id == localStorageService.get("Printer")){
					if(location.location.location_id == localStorageService.get("NamesNumbers"))
						$scope.currentPrintStatus = localStorageService.get("Printer_Regular_PrintLog_Count");
						// $scope.nextPrintStatusText = "Move to Next Print Status: " + Helpers.getObjectById(6, localStorageService.get("printstatuses")).name;
					// }
					// else
					$scope.nextPrintStatusText = "Move to Next Print Status: " + Helpers.getObjectById($scope.currentPrintStatus + 1, localStorageService.get("printstatuses")).name;
				}
			}
			// if($scope.printlogs.length == 0)
			// 	$scope.validNextPrintStatsus = true;

			// location.location.printlog;
		};

		$scope.gatherPending = function(){
			Account.overview(false);
			$rootScope.overview.query = "Pending";
		};

		// //function to process a printer location, and other locations can't be selected.
		// $scope.movetoNext = function(){
		// };

		// $scope.printNN = function(){
		// };
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

	// //funciton to select printer location
	// $scope.selectedLocation = function(img, location){

	// 	$scope.selectedImg = img;
	// 	$scope.selectedImgSrc = "/img/jobs/" + $stateParams.jobId + "/" + location + ".jpg";
	// 	$scope.largePreviewText = location + " is not included in the design";
	// }


});

var ROLES = ["Prep", "Printer", "QC", "Manager"];

var NON_MANAGER_DIV = "NonManagerDiv";
var ASSIGNED_MANAGER_DIV = "AssignedManagerDiv";
var UNASSIGNED_MANAGER_DIV = "UnassignedManagerDiv";
var PRINTER_DIV1 = "PrinterDiv1";
var PRINTER_DIV2 = "PrinterDiv2";

var ASSIGNMENT_COMPLETED = "Assignment Completed";
var ASSIGNMENT_NOT_READY = "Assignment Not Ready";
var PRINTING_NOT_STARTED = "Printing Not Started";
var PRINTING_NOT_READY = "Printing Not Ready For QC";
var QC_NOT_COMPLETED = "QC Not Completed";