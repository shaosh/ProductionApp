
angular.module('starter.controllers', ['ngResource', 'LocalStorageModule'])
.controller('socketCtrl', function($rootScope, $location, $state, Api, localStorageService, Helpers, socket, httpCache){
	var url = 'data/jobs.json';	
	//Socket.io listeners
	//Assume the data is a json object of a new job to a specific facility
	socket.on('job:received', function(data, callback){
		httpCache.add(url, data);
		// alert("after: " + JSON.parse(cachedJobs[1]).length);		
		if($rootScope.user.role_id == localStorageService.get('Manager')){
			Helpers.incrementPendingnum();
			$rootScope.pendingnum = localStorageService.get('pendingnum');
			data.pending = "Pending";
			$rootScope.jobs.push(data);
			localStorageService.set("joblist", $rootScope.jobs);
		}
	});
	//Need the server to include the job id in the data
	//Prefered structure: data: { job_id: "", message: ""}
	//This listener depends on $rootScope.jobs. In the jobview page, if the page is refreshed, the data
	//in the $rootScope.jobs is gone. So the user will not be able to receive the data. 
	socket.on('job:broadcast', function(data){
		if($rootScope.user.role_id != localStorageService.get('QC') &&
		   	Helpers.isJobinJoblist(data.job_id, $rootScope.jobs))
			alert(data.message);
	});

	//Need the server to include the json object of the job
	socket.on('job:changed', function(data){
		alert(JSON.stringify(data));
		if(!Helpers.isJobinJoblist(data.id, $rootScope.jobs))
			return;
		httpCache.update(url, data);
		alert("The Job " + data.id + " has been changed.");
		//If the user is no longer a staff for this job, remove it and update the pending number
		if((($rootScope.user.role_id == localStorageService.get('Prep') || $rootScope.user.role_id == localStorageService.get('Printer')) && !Helpers.isStaffinJob($rootScope.user, $rootScope.job)) ||
		   (($rootScope.user.role_id == localStorageService.get('Manager') || $rootScope.user.role_id == localStorageService.get('QC')) && !Helpers.facilityIdCompare($rootScope.user, data))	
		){
			alert("You have been removed from the Job " + data.id + ".");
			var job = Helpers.getObjectById(data.id, $rootScope.jobs);
			if(job.pending == "Pending"){
				Helpers.decrementPendingnum();
				$rootScope.pendingnum = localStorageService.get('pendingnum');					
			}				
			Helpers.removeItemFromList(data.id, $rootScope.jobs);
			localStorageService.set("joblist", $rootScope.jobs);
			if($rootScope.jobId == data.id){
				$location.path('/' + localStorageService.get('user').name + '/jobs');
			}
		}
		//If the user is still a staff of the job, update the pending number and job list. May reload the jobview page. 
		else{			
			data.pending = Helpers.isJobPending($rootScope.user, data);
			var job = Helpers.getObjectById(data.id, $rootScope.jobs);
			if(data.pending == "Pending" && job.pending == "")
				Helpers.incrementPendingnum();
			else if(data.pending == "" && job.pending == "Pending")
				Helpers.decrementPendingnum();
			Helpers.replaceItemFromList(data, $rootScope.jobs);
			localStorageService.set("joblist", $rootScope.jobs);
			//Now just reload the whole page, will change to update partial page later
			if($rootScope.jobId == data.id){
				$rootScope.job = data;
				$state.go($state.$current, null, {reload: true});
			}
		}
	});

	//Prefered the updated job to be sent with staff id
	//Prefered data structure:
	//data: {job: "", staff_id: "", add:"true/false"}
	socket.on('job:staff:changed', function(data){
		if(!Helpers.isJobinJoblist(data.job.id, $rootScope.jobs))
			return;
		if($rootScope.user.role_id == localStorageService.get('Prep') || 
		   $rootScope.user.role_id == localStorageService.get('Printer')){
			if(data.staff_id == $rootScope.user.id && data.add == true){
				Helpers.incrementPendingnum();
				$rootScope.pendingnum = localStorageService.get('pendingnum');
				data.job.pending = "Pending";
				$rootScope.jobs.push(data.job);
				localStorageService.set("joblist", $rootScope.jobs);
				alert("You have been assigned to a new Job: " + data.job.id +".");
			}
			else if(data.staff_id == $rootScope.user.id && data.add == false){
				var job = Helpers.getObjectById(data.job.id, $rootScope.jobs);
				// alert(JSON.stringify(job));
				// alert(job.pending);
				if(job == null)
					return;
				if(job.pending == "Pending"){
					Helpers.decrementPendingnum();
					$rootScope.pendingnum = localStorageService.get('pendingnum');					
				}				
				Helpers.removeItemFromList(data.job.id, $rootScope.jobs);
				localStorageService.set("joblist", $rootScope.jobs);
				alert("You have been removed from the Job " + data.job.id + ".");
				if($rootScope.jobId == data.job.id)
					$location.path('/' + localStorageService.get('user').name + '/jobs');
			}
		}
	});

	//data: log:{id:"", job_id:"", job_status_id:""}
	socket.on('job:log:changed', function(data){		
		if($rootScope.user.role_id == localStorageService.get("Manager")){
			Helpers.addJobLog(data, $rootScope.jobs);			
			//If it is in the jobview page of this job, add it to the job log list.
			//Second condition: prevent add the same log repeatedly
			if($rootScope.jobId == data.job_id && $rootScope.job.log.length == data.job_status_id){
				Helpers.addJobLogView(data, $rootScope.joblogs);
				$rootScope.job.log.push(data);
			}
			var logname = Helpers.getObjectById(data.job_status_id, localStorageService.get("logstatuses")).name;
			alert("The Job " + data.job_id + " is moved to Status " + logname + ".");
		}
		//Actually the prep does not need to do anything.
		//All the logs will be added after he clicks the button and before he informs the server.
		//The job will be added to the overview in the event job:staff:changed.
		//The job will be removed after he clicks the burn screen and before he informs the server.
		else if($rootScope.user.role_id == localStorageService.get("Prep")){
		}
		//The situation of the Printer is quite similar to that of the Prep
		else if($rootScope.user.role_id == localStorageService.get("Printer")){
		}
		//It is better if the server can also send the job if the log is printer_started
		else{
			if(data.job_status_id == localStorageService.get('Printer_Started_Log')){
				//The job item is fetched from the server, which is actually from the $http cache.
				Api.getData("jobs").query(function(jobs){
					var job = null;
					for(var i = 0; i < jobs.length; i++){
						if(jobs[i].id == data.job_id){
							job = jobs[i];
							break;
						}
					}
					if(job != null){
						alert("There is a new job for QC: " + job.id);
						//Pending badge will be incremented after it is ready for the QC.
						job.pending = "Printing";
						$rootScope.jobs.push(job);
						localStorageService.set("joblist", $rootScope.jobs);
					}
				});
			}
			else{
				Helpers.addJobLog(data, $rootScope.jobs);				
				if($rootScope.jobId == data.job_id && $rootScope.job.log.length == data.job_status_id){
					Helpers.addJobLogView(data, $rootScope.joblogs);
					$rootScope.job.log.push(data);
				}
			}
		}
	});
	//Data structure(location object): location:{id:"", job_id:"", location_id:"", printlog:""}
	socket.on('job:location:started', function(data){
		if($rootScope.user.role_id == localStorageService.get("Manager")){
			var locationname = Helpers.getObjectById(data.location_id, localStorageService.get("locations")).name;
			alert("The Location " + locationname + " of Job " + data.job_id + " is started." );
		}
	});
	//Data structure(printlog object): location:{id:"", job_id:"", location_id:"", print_status_id:""}
	socket.on('job:location:changed', function(data){
		if($rootScope.user.role_id == localStorageService.get("Manager")){
			var locationname = Helpers.getObjectById(data.location_id, localStorageService.get("locations")).name;
			var printlogname = Helpers.getObjectById(data.print_status_id, localStorageService.get("printstatuses")).name;
			alert("The Location " + locationname + " of Job " + data.job_id + " is moved to status " + printlogname + "." );
			Helpers.addPrintLog(data, $rootScope.jobs);
			
			//If it is in the jobview page and the related location is clicked
			//Prevent add the same status repeatedly or in inproper place
			if($rootScope.jobId == data.job_id && $rootScope.currentLocationID == data.location_id && 
			   ((data.print_status_id == $rootScope.printlogs.length && data.location_id != localStorageService.get("NamesNumbers")) ||
			   	(data.print_status_id == $rootScope.printlogs.length + parseInt(localStorageService.get('QC_Regular_PrintLog_Count')) && data.location_id == localStorageService.get("NamesNumbers")))){
				Helpers.addPrintLogView(data, $rootScope.printlogs);
				//Update $rootScope.job
				for(var i = 0; i < $rootScope.job.location; i++){
					if($rootScope.job.location[i].location_id == data.location_id){
						$rootScope.job.location[i].printlog.push(data);
						break;
					}
				}
			}
		}
		else if($rootScope.user.role_id == localStorageService.get("QC")){
			if(data.print_status_id == localStorageService.get("Press_Started_PrintLog")){
				var locationname = Helpers.getObjectById(data.location_id, localStorageService.get("locations")).name;
				var printlogname = Helpers.getObjectById(data.print_status_id, localStorageService.get("printstatuses")).name;
				alert("The Location " + locationname + " of Job " + data.job_id + " is moved to status " + printlogname + "." );
			}
			Helpers.addPrintLog(data, $rootScope.jobs);
			//If this is the first printing completed job, increment the pending badge for the QC as notification.
			if(data.print_status_id == localStorageService.get('Printer_Completed_Regular_PrintLog') || data.print_status_id == localStorageService.get('Printer_Completed_NN_PrintLog')){
				for(var i = 0; i < $rootScope.jobs.length; i++){
					if($rootScope.jobs[i].id == data.job_id){
						if($rootScope.jobs[i].pending == undefined || $rootScope.jobs[i].pending != "Pending"){
							Helpers.incrementPendingnum();
							$rootScope.pendingnum = localStorageService.get('pendingnum');
							$rootScope.jobs[i].pending = "Pending";
							localStorageService.set("joblist", $rootScope.jobs);
						}
						break;
					}				
				}	
			}
			//Prevent add the same status repeatedly or in inproper place
			//If the printlog of current location is updated
			if($rootScope.jobId == data.job_id && $rootScope.currentLocationID == data.location_id && 
			   ((data.print_status_id == $rootScope.printlogs.length && data.location_id != localStorageService.get("NamesNumbers")) ||
			   	(data.print_status_id == $rootScope.printlogs.length + parseInt(localStorageService.get('QC_Regular_PrintLog_Count')) && data.location_id == localStorageService.get("NamesNumbers")))){
				//Update $rootScope.job
				for(var i = 0; i < $rootScope.job.location.length; i++){
					if($rootScope.job.location[i].location_id == data.location_id){
						$rootScope.job.location[i].printlog.push(data);
						break;
					}
				}
				//Update the screen
				Helpers.addPrintLogView(data, $rootScope.printlogs);
				if(data.print_status_id == localStorageService.get('Printer_Completed_Regular_PrintLog') || data.print_status_id == localStorageService.get('Printer_Completed_NN_PrintLog')){
					$rootScope.validNextPrintStatus = true;
					$rootScope.nextPrintStatusText = Helpers.getObjectById(data.print_status_id + 1, localStorageService.get("printstatuses")).name;
					$rootScope.currentPrintStatus = data.print_status_id;
					$rootScope.nextStatusText = QC_NOT_COMPLETED;
					$rootScope.currentStatus = localStorageService.get("Printer_Completed_Log");
					Helpers.makePreviewReady($rootScope.previews, data.location_id);
				}			
			}
			//If the printlog of other location is updated
			else if($rootScope.jobId == data.job_id && $rootScope.currentLocationID != data.location_id){	
				for(var i = 0; i < $rootScope.job.location.length; i++){
					if($rootScope.job.location[i].location_id == data.location_id){
						if((data.print_status_id == $rootScope.job.location[i].printlog.length && data.location_id != localStorageService.get("NamesNumbers")) ||
			   			   (data.print_status_id == $rootScope.job.location[i].printlog.length + parseInt(localStorageService.get('QC_Regular_PrintLog_Count')) && data.location_id == localStorageService.get("NamesNumbers"))){
							//Update $rootScope.job
							$rootScope.job.location[i].printlog.push(data);
							//Update screen
							if(data.print_status_id == localStorageService.get('Printer_Completed_Regular_PrintLog') || data.print_status_id == localStorageService.get('Printer_Completed_NN_PrintLog')){
								Helpers.makePreviewReady($rootScope.previews, data.location_id);
							}
							break;
						}
					}
				}
			}
		}
	});
	socket.on('job:location:complete', function(data){
		if($rootScope.user.role_id == localStorageService.get("Manager")){
			var locationname = Helpers.getObjectById(data.location_id, localStorageService.get("locations")).name;
			alert("The Location " + locationname + " of Job " + data.job_id + " is completed." );
		}
		else if($rootScope.user.role_id == localStorageService.get("QC")){
			if($rootScope.jobId == data.job_id){
				Helpers.removePreview(data.location_id, $rootScope.previews);
				if($rootScope.previews.length == 0){
					$rootScope.nextStatusText = Helpers.getObjectById(localStorageService.get("QC_Completed_Log"), localStorageService.get("logstatuses")).name;
				}
			}
		}
	});
	//Assume the data is just the job id
	socket.on('job:complete', function(data){
		httpCache.remove(url, data);
		if($rootScope.user.role_id == localStorageService.get("Manager") || $rootScope.user.role_id == localStorageService.get("Printer")){
			if($rootScope.user.role_id == localStorageService.get("Manager")){
				alert("The Job "  + data + " is completed.");
			}
			if(Helpers.isJobinJoblist(data.job_id, $rootScope.jobs))
				Helpers.removeItemFromList(data, $rootScope.jobs);
		}
	});
	//Data structure: User:{id:"", facility_id:"", name:"", role_id:""}
	socket.on('staff:authenticated', function(data){
		if($rootScope.user.role_id == localStorageService.get("Manager")){
			alert(Helpers.getObjectById(data.role_id, localStorageService.get("roles")).name + " " + data.name + " is authenticated.");
		}
	});	

})

.controller('LoginCtrl', function($scope, $location, localStorageService, cssInjector, Account, Api, Helpers){
	if(
		localStorageService.get("user") != undefined &&
		localStorageService.get("password") != undefined &&
		localStorageService.get("authenticated") == "true"
	){
		$location.path("/#/" + localStorageService.get("user").name + '/jobs');
	}

	cssInjector.removeAll();
	cssInjector.add('css/login.css');    
	$scope.logindata = {};
	
	if(localStorageService.get("user") != undefined){
		$scope.logindata.username = localStorageService.get("user").name;
		$scope.logindata.roleid = localStorageService.get("user").role_id;
	}

	if(localStorageService.get("password") != undefined)
		$scope.logindata.password = localStorageService.get("password");

	$scope.roles = Api.getData("roles").query();

	$scope.login = function(){
		var username = $scope.logindata.username;
		var password = $scope.logindata.password;
		var roleid = $scope.logindata.roleid;
		var rolename = $scope.roles[roleid].name;
		if(username == undefined || password == undefined || roleid == undefined){
			$scope.logindata.alert = "Error: Incomplete Authentication Information";
			return;
		}

		Api.getData("staffs").query(function(data){
			var user = Helpers.getObjectByName(username, data);
			if(user != null && roleid == user.role_id){
				Account.login(user, password, rolename);

				// localStorageService.clearAll();
				localStorageService.set("roles", $scope.roles);
				Account.cacheConstants();
			}
			else
				$scope.logindata.alert = "Error: Incorrect Authentication Information";
			}
		);
	};

	$scope.clearCookies = function(){
		localStorageService.remove("user");
		localStorageService.remove("password");
		localStorageService.remove("authenticated");
		localStorageService.remove("rolename");

		$scope.logindata.username = "";
		$scope.logindata.password = "";
		$scope.logindata.roleid = "";
	};
})

.controller('OverviewCtrl', function($rootScope, $scope, $stateParams, $cacheFactory, $http, $location, $state, $cordovaBarcodeScanner, cssInjector, localStorageService, Helpers, Account, Api, httpCache, socket){
	cssInjector.removeAll();
	cssInjector.add('css/overview.css');
	cssInjector.add('css/subheader.css');
// $httpDefaultCache = $cacheFactory.get('$http');
// if($httpDefaultCache.get('data/jobs.json') != undefined)
// alert("after: " + JSON.parse($httpDefaultCache.get('data/jobs.json')[1]).length);
	$rootScope.user = localStorageService.get("user");
	if($rootScope.user.role_id == localStorageService.get("Manager"))
		$scope.isManager = true;
	else
		$scope.isManager = false;

	//Function to take picture of the barcode
	$scope.takeBarcode = function(){
		$cordovaBarcodeScanner.scan().then(function(result) {
			//The first 6 digit of the barcode text is the orderID/jobID
			var orderId = result.text.substring(0, BARCODE_LENGTH);
		},
		function(err){
			alert("ERROR: " + err);
		});
		/*Code to take picture with Phonegap.camera
		var options =   {
			quality : 100, 
	        destinationType : Camera.DestinationType.FILE_URI, 
	        sourceType : Camera.PictureSourceType.CAMERA, 
	        allowEdit : false,
	        encodingType: Camera.EncodingType.JPEG,
	        popoverOptions: CameraPopoverOptions,
	        saveToPhotoAlbum: true
        };
        $cordovaCamera.getPicture(options).then(function(FILE_URI) {
        	alert(FILE_URI);
	      // Success! Image data is here
	    }, function(err) {
	    	alert("Fail to Take the Barcode because: " + err);
	      // An error occured. Show a message to the user
	    });
		*/
	};

	$scope.rolename = localStorageService.get("rolename");
	$scope.orderProp = '';
	$scope.isOverview = false;
	$scope.$logoff = Account;
	$scope.$overview = function(){
		$rootScope.overview.query = "";
	};

	//Account;
	//$scope.overview added for query to be updated from input
	if($rootScope.overview == undefined || $rootScope.overview.query != "Pending")
		$rootScope.overview = {};

	//Variable related to the order of the job list
	$scope.reverse = false;
	//Variable related to the pending number showed in the subtitle
	//Have to store the badge number in local storage, otherwise it is incorrect after refresh in the job view page.
	localStorageService.set('pendingnum', "");
	$rootScope.pendingnum = "";
	$rootScope.badgelink = "/#/" + $rootScope.user.name + "/pendingjobs";

	$scope.reverseOrder = function(){
		$scope.reverse = !$scope.reverse;
	};

	//Test caching
	// var $httpDefaultCache = $cacheFactory.get('$http');
	// var cachedJobs = $httpDefaultCache.get('data/jobs.json');
	// alert("before: " + JSON.parse(cachedJobs[1]).length);

	Api.getData("jobs").query(function(data){
		// var url = 'data/jobs.json';
		// alert(httpCache.getCount(url));
		$rootScope.jobs = [];
		angular.forEach(data, function(job){
			if($rootScope.user.role_id == localStorageService.get("QC") || $rootScope.user.role_id == localStorageService.get("Manager")){
				if(Helpers.facilityIdCompare($rootScope.user, job)){
					//Check the status of each job, and determine if attach the "Pending" badge
					job.pending = Helpers.isJobPending($rootScope.user, job);

					//Add the job for the manager
					if($rootScope.user.role_id == localStorageService.get("Manager"))
						$rootScope.jobs.push(job);
					//Add the job for the QC only when the job is ready for him. According to Cory, a job should be added to the QC's job list if it is started printing
					else if($rootScope.user.role_id == localStorageService.get("QC") && job.log.length == localStorageService.get('Printer_Started_Log_Count')){ //Helpers.isJobReadyForQC(job))
						if(!Helpers.isJobReadyForQC(job))
							job.pending = "Printing";
						$rootScope.jobs.push(job);
					}
				}
			}
			else{
				if(Helpers.isStaffinJob($rootScope.user, job)){
					//Check the status of each job, and determine if attach the "Pending" badge
					job.pending = Helpers.isJobPending($rootScope.user, job);
					$rootScope.jobs.push(job);
				}
			}	

			//Calculate the pending job number in the badge in the subtitle
			if(job.pending != "" && job.pending != undefined && job.pending != "Printing"){
				Helpers.incrementPendingnum();
				$rootScope.pendingnum = localStorageService.get('pendingnum');
			}			
		});
		//Store the jobs list into the local storage, otherwise the jobs will be null after refresh the job view page.
		//The rootScope.jobs(not scope.jobs) and its localstorage are mainly used for updating te pending num in the jobview page, not for other job details. 
		localStorageService.set("joblist", $rootScope.jobs);
	});
	$scope.gatherPending = function(){		
		$rootScope.overview.query = "Pending";
	};
})

.controller('JobviewCtrl', function($rootScope, $scope, $stateParams, $cacheFactory, $location, localStorageService, cssInjector, Helpers, Account, Api, httpCache, socket, matchmedia){
	$rootScope.viewers = [];
	//Notify the socket server the user opens this page
	socket.emit('client:job:opened', {
		"jobid": $stateParams.jobId,
		"user": localStorageService.get("user")
	}, function(result){
		alert(JSON.stringify(result));
		if(!result)
			alert('error!');
		else{
			alert("remove start");
			Helpers.removeItemFromList(localStorageService.get("user").id, result);
			alert("remove end");
			$scope.viewers = result;
			//Display warning for non-first QC viewing the job
		}
	});
	//Notify the socket server the user leaves this page
	$rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
	    if(from.name == "jobview"){
	    	socket.emit('client:job:closed', {
				"jobid": $stateParams.jobId,
				"user": localStorageService.get("user")
			});
			delete($stateParams.jobId);
	    }
	});

	setInterval(function(){
		if($stateParams.jobId != undefined){
			socket.emit('client:job:ping',{
				"jobid": $stateParams.jobId,
				"user": localStorageService.get("user")
			});
		}
	}, 5000);

	//Socket Listeners monitoring the changes of the viewerlist
	//Remove the user himself from the viewer list
	socket.on('client:job:opened', function(data){
		Helpers.removeItemFromList(localStorageService.get("user").id, data);
		$scope.viewers = data;
	});

	socket.on('client:job:closed', function(data){
		Helpers.removeItemFromList(localStorageService.get("user").id, data);
		$scope.viewers = data;
	});	

	$scope.location = {}
	//Adjust the layout based on the device width
	matchmedia.onLandscape(function(mediaQueryList){
		if(mediaQueryList.matches){
			$scope.location.url = "templates/WidePriview.html";
		}
	});
	matchmedia.onPortrait(function(mediaQueryList){
		if(mediaQueryList.matches){
			$scope.location.url = "templates/NarrowPriview.html";
		}
	});

	cssInjector.removeAll();
	cssInjector.add('css/jobview.css');
	cssInjector.add('css/subheader.css');
	var user = localStorageService.get("user");	
	var roles = localStorageService.get("roles");
	$rootScope.pendingnum = localStorageService.get('pendingnum');	
	//Clear the overview.query
	$rootScope.user = user;
	$scope.rolename = localStorageService.get("rolename");
	$scope.isOverview = false;
	//Function to log off
	$scope.$logoff = Account;	
	//Function to go to overview page
	$scope.$overview = function(){
		$location.path('/' + localStorageService.get('user').name + '/jobs');
		$rootScope.overview.query = "";
	};
	if($rootScope.jobs == undefined || $rootScope.jobs == null){
		$rootScope.jobs = localStorageService.get("joblist");
	}

	//This rootScope variable is specifically for the socket listener to get to know which page the app is in.
	$rootScope.jobId =  $stateParams.jobId;

	/*Code to check and parse $http cache
	var $httpDefaultCache = $cacheFactory.get('$http');
	var cachedJobs = $httpDefaultCache.get('data/jobs.json');
	alert("before: " + JSON.stringify(JSON.parse(cachedJobs[1])));
	var jsonobj = JSON.parse("{\"id\": 554114,\"name\": \"vidhyachrometest\", \"facility_id\": 2,\"location\": [], \"staff\": [],\"log\": []}");
	var url = 'data/jobs.json';
	httpCache.add(url, jsonobj);
	httpCache.modify(url, jsonobj, 1);
	alert("after: " + JSON.stringify(JSON.parse($cacheFactory.get('$http').get('data/jobs.json')[1])));
	*/

	//Test caching
	// var $httpDefaultCache = $cacheFactory.get('$http');
	// var cachedJobs = $httpDefaultCache.get('data/jobs.json');
	// alert("before: " + JSON.parse(cachedJobs[1]).length);
	//Socket.io listeners
	// var url = 'data/jobs.json';
	// $rootScope.jobs = httpCache.get(url);

	//Code which depends on the job variable
	//Fetch the specific job based on its job id.
	Api.getData("jobs").query(function(data){
		for(var i = 0; i < data.length; i++){
			if(data[i].id == $stateParams.jobId){
				job = data[i];
				break;
			}
		}
		$rootScope.job = job;
		$rootScope.previews = [];
		//Generate the small preview image for all locations
		angular.forEach($rootScope.job.location, function(location){
			var previewname = Helpers.getObjectById(location.location_id, localStorageService.get("locations")).name.toLowerCase();
			if(location.location_id == localStorageService.get("NamesNumbers"))
				var src = "img/namesnums.png";
			else
				var src = "img/jobs/" + $rootScope.job.id + "/" + previewname + ".jpg";
			if(user.role_id == localStorageService.get("Manager") || user.role_id == localStorageService.get("Prep") || user.role_id == localStorageService.get("Printer"))
				var isReady = true;
			//If a location is completed by a printer, it is ready for the QC
			else
				var isReady = Helpers.isLocationComplete(localStorageService.get("Printer"), location);
			location.src = src;
			location.name = previewname;
			location.ready = isReady;
			if(user.role_id == localStorageService.get('Printer') || user.role_id == localStorageService.get('QC')){
				if(!Helpers.isLocationComplete(user.role_id, location))
					$rootScope.previews.push(location);
			}
			else{
				$rootScope.previews.push(location);
			}
		});
		$scope.facility_name = Helpers.getObjectById($rootScope.job.facility_id, localStorageService.get("facilities")).name;

		//Generate job logs
		$rootScope.joblogs = [];
		for(var i = 0; i < $rootScope.job.log.length; i++){
			var logname = Helpers.getObjectById($rootScope.job.log[i].job_status_id, localStorageService.get("logstatuses")).name;
			var logicon = "";
			if(i != $rootScope.job.log.length - 1 || $rootScope.job.log[i].job_status_id == localStorageService.get("Manager_Completed_Log") || $rootScope.job.log[i].job_status_id == localStorageService.get("Prep_Completed_Log") || $rootScope.job.log[i].job_status_id == localStorageService.get("Printer_Completed_Log"))
				logicon = "ion-checkmark";
			else if( $rootScope.job.log[i].job_status_id == localStorageService.get("QC_Completed_Log"))
				logicon = "ion-checkmark-circled";
			else
				logicon = "ion-arrow-right-a";

			$rootScope.joblogs.push({
				"name": logname,
				"icon": logicon
			});
		}
		$scope.orderProp = "id";

		//Add the next status button for non-manager users
		if(user.role_id != localStorageService.get("Manager")){
			$scope.UpdateStatusDiv = "templates/" + NON_MANAGER_DIV + ".html";
			//Find all the job logs based on the user's role
			var logtextlist = [];
			angular.forEach(localStorageService.get("logstatuses"), function(log){
				if(log.role_id == user.role_id){
					logtextlist.push(log);
				}
			});

			//Try to find: for a specific user, which status update is available
			$rootScope.nextStatusText = ""; 
			if(user.role_id == localStorageService.get("Prep"))
				$scope.validNextStatus = true;
			else
				$scope.validNextStatus = false;
			$rootScope.currentStatus = 0;

			//If the job is already started, how to determine the current status of the job
			if($rootScope.joblogs.length >= logtextlist[0].id){
				for(var i = 0; i < logtextlist.length; i++){
					var logExisted = false;
					//Find which log of the user is not existed
					for(var j = 0; j < $rootScope.joblogs.length; j++){
						if($rootScope.joblogs[j].name == logtextlist[i].name){
							logExisted = true;
							$rootScope.currentStatus = logtextlist[i].id;
						}
					}
					//Find out which status is the next status
					if(!logExisted && $rootScope.joblogs.length == logtextlist[i].id){
						if(user.role_id == localStorageService.get("Prep")){
							$rootScope.nextStatusText = "Move to Next Status: " + logtextlist[i].name;
							//Not change the value of currentStatus here
							//So for prep the currentStatus always starts with 0, which can be used as the index
							//of Prep's logtextlist.
						}
						else if(i == 0 && user.role_id == localStorageService.get("Printer")){
							$rootScope.nextStatusText = PRINTING_NOT_STARTED;
							i = localStorageService.get("Prep_Completed_Log");
							$rootScope.currentStatus = i;
						}
						else if(i == 0 && user.role_id == localStorageService.get("QC")){
							$rootScope.nextStatusText = QC_NOT_COMPLETED;
							i = localStorageService.get("Printer_Completed_Log");
							$rootScope.currentStatus = i;
						}
						else
							$rootScope.nextStatusText = logtextlist[i - 1].name;
						break;
					}
				}
				//The job is completed for this user
				if($rootScope.nextStatusText == ""){
					$rootScope.nextStatusText = logtextlist[logtextlist.length - 1].name;
					$scope.validNextStatus = false;
				}
			}

			//The job is not ready for the user
			else{
				if(user.role_id == localStorageService.get("QC") && Helpers.isJobReadyForQC($rootScope.job)){
					$rootScope.nextStatusText = QC_NOT_COMPLETED;
					$rootScope.currentStatus = localStorageService.get("Printer_Completed_Log");
				}
				else
					$rootScope.nextStatusText = ASSIGNMENT_NOT_READY;
				$scope.validNextStatus = false;
			}

			//Actually this button is only valid for Prep
			//Here $rootScope.currentStatus is used as array index which starts from 0
			$scope.movetoNextStatus = function(){
				if(!$scope.validNextStatus)
					return;
				var logicon = "";
				//Seems the length==5 or 6 will not be invoked here
				//The log to be added is Prep/Printer Complete
				if($rootScope.joblogs.length == localStorageService.get("Prep_Completed_Log") || $rootScope.joblogs.length == localStorageService.get("Printer_Completed_Log"))
					logicon = "ion-checkmark";
				else if($rootScope.joblogs.length == localStorageService.get("logstatuses").length - 1)//6)
					logicon = "ion-checkmark-circled";
				else
					logicon = "ion-arrow-right-a";

				$rootScope.joblogs.push({
					"name": logtextlist[$rootScope.currentStatus].name,
					"icon": logicon
				});

				for(var i = 0; i < $rootScope.joblogs.length - 1; i++){
					$rootScope.joblogs[i].icon = "ion-checkmark";
				}

				$rootScope.currentStatus++;
				if($rootScope.currentStatus < logtextlist.length){
					$rootScope.nextStatusText = "Move to Next Status:" + logtextlist[$rootScope.currentStatus].name;

					//$rootScope.currentStatus here is actually array index. If it is 1, it means the job is just started.
					if(user.role_id == localStorageService.get("Prep") && $rootScope.currentStatus == 1){
						Helpers.decrementPendingnum();
						$rootScope.pendingnum = localStorageService.get("pendingnum");
						//The code below is used to update pendingnum correctly.
						//Otherwise after the job is started and no longer pending, if the job is removed,
						//the pendingnum will be decremented again.
						$rootScope.job.pending = "";
						Helpers.replaceItemFromList($rootScope.job, $rootScope.jobs);
						localStorageService.set("joblist", $rootScope.jobs);
					}
				}
				//The job is completed for this user
				else{
					$rootScope.nextStatusText = logtextlist[logtextlist.length - 1].name;
					$scope.validNextStatus = false;
					//If the job is burned by the Prep, it should be removed from the user's job overview. 
					if(user.role_id == localStorageService.get("Prep")){
						Helpers.removeItemFromList($rootScope.job.id, $rootScope.jobs);
					}
				}
			};
		}
		//Add the assign job button for manager users
		else{
			$scope.preps = [];
			$scope.printers = [];
			var prep = Helpers.findAssignedStaff(localStorageService.get("Prep"), $rootScope.job.staff);
			var printer = Helpers.findAssignedStaff(localStorageService.get("Printer"), $rootScope.job.staff);
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
				$scope.UpdateStatusDiv = "templates/" + ASSIGNED_MANAGER_DIV + ".html";	
				$scope.assign = function(){
					$scope.alert = "This job has already been assigned";
				};
			}
			//If this job has not been assigned
			else{
				Api.getData("staffs").query(function(data){				
					angular.forEach(data, function(staff){
						if(staff.role_id == localStorageService.get("Prep") && Helpers.facilityIdCompare(staff, $rootScope.job)){
							$scope.preps.push(staff);
						}
						else if(staff.role_id == localStorageService.get("Printer") && Helpers.facilityIdCompare(staff, $rootScope.job)){
							$scope.printers.push(staff);
						}
					});
				});
				
				$scope.assignee = {};
				//$scope.assigned means if the assign job button is available 
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
						//Update both remote joblist and local job variable
						Api.assignStaffs(staffs, $rootScope.job);
						
						//Update the job log in the view
						var logstatuses = localStorageService.get("logstatuses");
						var logname = logstatuses[localStorageService.get("Manager_Completed_Log")].name;
						var logicon = "ion-checkmark";
						$rootScope.joblogs[$rootScope.joblogs.length - 1].icon = "ion-checkmark";
						$rootScope.joblogs.push({
							"name": logname,
							"icon": logicon
						});

						$scope.alert = "Job assigned";
						//Decrement the badge number
						Helpers.decrementPendingnum();
						$rootScope.pendingnum = localStorageService.get("pendingnum");
						$rootScope.job.pending = "";
						Helpers.replaceItemFromList($rootScope.job, $rootScope.jobs);
						localStorageService.set("joblist", $rootScope.jobs);
						$scope.assigned = false;
					}
					else{
						$scope.alert = "This job has already been assigned";
					}
				};
				$scope.UpdateStatusDiv = "templates/" + UNASSIGNED_MANAGER_DIV + ".html";
			}			
		}

		//Add the areas specific for printer/QC users
		if(user.role_id == localStorageService.get("Printer") || user.role_id == localStorageService.get("QC")){
			//For printers, always add the change print status button
			$scope.PrinterDiv1 = "templates/" + PRINTER_DIV1 + ".html";
			//Check if the printer has "Names & Numbers" job
			if(Helpers.hasNamesNumbers($rootScope.job, localStorageService.get("NamesNumbers"))){
				$scope.PrinterDiv2 = "templates/" + PRINTER_DIV2 + ".html";
			}

			$scope.movetoNextPrintStatus = function(){
				if(!$rootScope.validNextPrintStatus)
					return;
				// $scope.processing = true;
				var printlogList = localStorageService.get("printstatuses");
				var logicon = "ion-checkmark";				
				$rootScope.currentPrintStatus++;
				//Update the printlog of the location in the $rootScope.job
				for(var i = 0; i < $rootScope.job.location.length; i++){
					if($rootScope.job.location[i].location_id == $rootScope.currentLocationID){
						$rootScope.job.location[i].printlog.push({
							"id": $rootScope.job.location[i].printlog.length,
							"job_id": $rootScope.jobId,
							"location_id": $rootScope.currentLocationID,
							"print_status_id": $rootScope.currentPrintStatus
						});
					}
				}
				if($rootScope.currentPrintStatus == localStorageService.get("QC_Completed_Regular_PrintLog") || $rootScope.currentPrintStatus == localStorageService.get("QC_Completed_NN_PrintLog")){
					logicon = "ion-checkmark-circled";
					$rootScope.validNextPrintStatus = false;
					$rootScope.nextPrintStatusText = Helpers.getObjectById($rootScope.currentPrintStatus, localStorageService.get("printstatuses")).name;
					//Decrement the badge if the job is not started for the QC
					if(!Helpers.checkQCStart($rootScope.job) || Helpers.hasPending($rootScope.job, $rootScope.jobs)){
						Helpers.decrementPendingnum();
						$rootScope.pendingnum = localStorageService.get("pendingnum");
						$rootScope.job.pending = "";
						Helpers.replaceItemFromList($rootScope.job, $rootScope.jobs);
						localStorageService.set("joblist", $rootScope.jobs);
					}
					Helpers.removePreview($rootScope.currentLocationID, $rootScope.previews);

					//If all locations are QCed, the job is completed for the QC.
					if(Helpers.checkPrintingComplete($rootScope.job, user.role_id, $rootScope.currentLocationID)){
						$rootScope.currentStatus++;
						$rootScope.nextStatusText = Helpers.getObjectById($rootScope.currentStatus, localStorageService.get("logstatuses")).name;
						$rootScope.joblogs.push({
							"name": $rootScope.nextStatusText,
							"icon": logicon
						});
						//Remove the job from the overview after it is finished by the QC
						Helpers.removeItemFromList($rootScope.job.id, $rootScope.jobs);						
					}
				}
				else if($rootScope.currentPrintStatus == localStorageService.get("Printer_Completed_Regular_PrintLog") || $rootScope.currentPrintStatus == localStorageService.get("Printer_Completed_NN_PrintLog")){
					if(user.role_id == localStorageService.get("Printer")){
						$rootScope.validNextPrintStatus = false;
						$rootScope.nextPrintStatusText = Helpers.getObjectById($rootScope.currentPrintStatus, localStorageService.get("printstatuses")).name;
						Helpers.removePreview($rootScope.currentLocationID, $rootScope.previews);

						//If all locations are printed, the job is completed for the printer.
						if(Helpers.checkPrintingComplete($rootScope.job, user.role_id, $rootScope.currentLocationID)){
							$rootScope.currentStatus++;
							$rootScope.nextStatusText = Helpers.getObjectById($rootScope.currentStatus, localStorageService.get("logstatuses")).name;
							$rootScope.joblogs.push({
								"name": $rootScope.nextStatusText,
								"icon": logicon
							});
							for(var i = 0; i < $rootScope.joblogs.length - 1; i++){
								$rootScope.joblogs[i].icon = "ion-checkmark";
							}
							//Remove the job from the overview after it is finished by the printer
							Helpers.removeItemFromList($rootScope.job.id, $rootScope.jobs);
						}
					}
				}
				else{
					$rootScope.nextPrintStatusText = "Move to Next Print Status: " + Helpers.getObjectById($rootScope.currentPrintStatus + 1, localStorageService.get("printstatuses")).name;
				}
				$rootScope.printlogs.push({
					"name": Helpers.getObjectById($rootScope.currentPrintStatus, localStorageService.get("printstatuses")).name,
					"icon": logicon
				});

				if($rootScope.nextStatusText == PRINTING_NOT_STARTED){
					$rootScope.currentStatus++;
					$rootScope.nextStatusText = Helpers.getObjectById($rootScope.currentStatus, localStorageService.get("logstatuses")).name;
					$rootScope.joblogs.push({
						"name": $rootScope.nextStatusText,
						"icon": "ion-arrow-right-a"
					});
					//Decrement badge for Printer
					Helpers.decrementPendingnum();
					$rootScope.pendingnum = localStorageService.get("pendingnum");
					$rootScope.job.pending = "";
					Helpers.replaceItemFromList($rootScope.job, $rootScope.jobs);
					localStorageService.set("joblist", $rootScope.jobs);
				}
			};
		}
		
		//Tag to mark if a location is being printing. If so, the user can't select other printer location.
		//funciton to select printer location
		$scope.selectedLocation = function(img, location){
			$scope.selectedImg = img;
			$scope.selectedImgSrc = location.src;
			$scope.largePreviewText = location.name + " is not included in the design";
			$scope.largePreviewName = location.name;
			$rootScope.printlogs = [];
			$rootScope.validNextPrintStatus = true;
			$rootScope.currentPrintStatus = -1;
			$rootScope.currentLocationID = location.location_id;
			//Display the print logs
			angular.forEach(location.printlog, function(printlog){
				var logicon = "";
				//For any role the job is completed
				if(printlog.print_status_id == localStorageService.get("QC_Completed_Regular_PrintLog") || printlog.print_status_id == localStorageService.get("QC_Completed_NN_PrintLog")){
					logicon = "ion-checkmark-circled";
					$rootScope.validNextPrintStatus = false;
					if(user.role_id == localStorageService.get("QC"))
						$rootScope.nextPrintStatusText = Helpers.getObjectById(printlog.print_status_id, localStorageService.get("printstatuses")).name;
					else if(user.role_id == localStorageService.get("Printer"))
						$rootScope.nextPrintStatusText = Helpers.getObjectById(printlog.print_status_id - 1, localStorageService.get("printstatuses")).name;
				}
				//For printer the job is completed; for QC, the job is available to start
				else if(printlog.print_status_id == localStorageService.get("Printer_Completed_Regular_PrintLog") || printlog.print_status_id == localStorageService.get("Printer_Completed_NN_PrintLog")){
					logicon = "ion-checkmark";
					if(user.role_id == localStorageService.get("Printer")){
						$rootScope.validNextPrintStatus = false;
						$rootScope.nextPrintStatusText = Helpers.getObjectById(printlog.print_status_id, localStorageService.get("printstatuses")).name;
					}
					else if(user.role_id == localStorageService.get("QC")){
						$rootScope.validNextPrintStatus = true;
						$rootScope.currentPrintStatus = printlog.print_status_id;
						$rootScope.nextPrintStatusText = "Move to Next Print Status: " + Helpers.getObjectById(printlog.print_status_id + 1, localStorageService.get("printstatuses")).name;						
					}
				}
				//For printer the job can be continued; for QC, the job is not ready.
				else{
					logicon = "ion-checkmark";
					if(user.role_id == localStorageService.get("Printer")){
						$rootScope.nextPrintStatusText = "Move to Next Print Status: " + Helpers.getObjectById(printlog.print_status_id + 1, localStorageService.get("printstatuses")).name;
						$rootScope.currentPrintStatus = printlog.print_status_id;
					}
					else if(user.role_id == localStorageService.get("QC")){
						$rootScope.validNextPrintStatus = false;
						$rootScope.nextPrintStatusText = PRINTING_NOT_READY;
					}
				}
				$rootScope.printlogs.push({
					"name": Helpers.getObjectById(printlog.print_status_id, localStorageService.get("printstatuses")).name,
					"icon": logicon
				});
			});

			//Set the first print status when there is no printlog
			if($rootScope.printlogs.length == 0){
				if(user.role_id == localStorageService.get("QC")){
					$rootScope.validNextPrintStatus = false;
					$rootScope.nextPrintStatusText = PRINTING_NOT_READY;
				}
				else if(user.role_id == localStorageService.get("Printer")){
					if(location.location_id == localStorageService.get("NamesNumbers"))
						$rootScope.currentPrintStatus = localStorageService.get("Printer_Regular_PrintLog_Count");
					$rootScope.nextPrintStatusText = "Move to Next Print Status: " + Helpers.getObjectById($rootScope.currentPrintStatus + 1, localStorageService.get("printstatuses")).name;
				}
			}

			//Adjust the layout based on the device width
			if(matchmedia.isLandscape() || matchmedia.isDesktop()){
				$scope.location.url = "templates/WidePriview.html";
			}
			else{
				$scope.location.url = "templates/NarrowPriview.html";
			}
		};
		$scope.gatherPending = function(){
			Account.overview(false);
			$rootScope.overview.query = "Pending";
		};
	});
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

var BARCODE_LENGTH = 6;