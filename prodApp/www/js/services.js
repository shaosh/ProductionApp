angular.module('starter.services', ['LocalStorageModule'])
.factory('User', function(){
	var users = [
		{id: 0, name: "TimDuncan", role: ROLES[0]},
		{id: 1, name: "ManuGinobili", role: ROLES[1]},
		{id: 2, name: "TonyParker", role: ROLES[2]},
		{id: 3, name: "GreggPopovich", role: ROLES[3]},
		{id: 4, name: "TiagoSplitter", role: ROLES[0]},
		{id: 5, name: "BorisDiaw", role: ROLES[1]},
		{id: 6, name: "PatrickMills", role: ROLES[2]},
		{id: 7, name: "RCBuford", role: ROLES[3]},
	];

	return{
		get: function(userId){
			for(var i = 0; i < users.length; i++){
				if(users[i].id == userId)
					return users[i];
			}
			return null;
		},

		getUserByName: function(userName){
			for(var i = 0; i < users.length; i++){
				if(users[i].name == userName)
					return users[i];
			}
			return null;
		},

		getUsersByRole: function(role){
			var userList = [];
			for(var i = 0; i < users.length; i++){
				if(users[i].role == role){
					userList.push(users[i]);
				}
			}
			return userList;
		}
	}
})

.factory('Jobs', function() {
	var jobs = [
		{id: 554114, name: "names and numbers", print_location: [{name: "front", location: "front"},{name: "back", location: "back"}, {name: "nape", location: "nape"}]},// print_location: "[{name: "front", location: "front"},{name: "back", location: "back"}, {name: "nape", location: "nape"}]"},// "back", "nape"]},
		{id: 554120, name: "cart-sizeup-test"},
		{id: 554133, name: "gingerbreadman-test 2"},
		{id: 554790, name: "franklin family"},
		{id: 554803, name: "testingdevtest"},
		{id: 554804, name: "flagtest"},
		{id: 554810, name: "254"},
		{id: 554814, name: "vidhyachrometest"}
	];

	return{
		all: function(){
			return jobs;
		},

		get: function(jobId){
			for(var i = 0; i < jobs.length; i++){
				if(jobs[i].id == jobId){
					return jobs[i];
				}
			}
			return null;
		}
	}
})

.factory('Account', function($location, localStorageService, Api){
	return{
		login: function(user, password, rolename){
			localStorageService.clearAll();
			localStorageService.set("user", user);
			localStorageService.set("password", password);
			localStorageService.set("rolename", rolename);
			localStorageService.set("authenticated", "true");
			// localStorageService.set("roles", $scope.roles);
			$location.path('/' + user.name + '/jobs');
		},

		cacheConstants: function(){
			//Cache role list
			var roles = localStorageService.get("roles");
			for(var i = 0; i < roles.length; i++){
				if(roles[i].name == "Prep")
					localStorageService.set("Prep", roles[i].id);
				else if(roles[i].name == "Printer")
					localStorageService.set("Printer", roles[i].id);
				else if(roles[i].name == "QC")
					localStorageService.set("QC", roles[i].id);
				else if(roles[i].name == "Manager")
					localStorageService.set("Manager", roles[i].id);
			}
 
 			//Cache other constant lists
			var constants = ["locations", "facilities", "logstatuses", "printstatuses"];
			angular.forEach(constants, function(constant){
				Api.getData(constant).query(function(data){
					localStorageService.set(constant, data);

					//Put some special value into the local storage
					if(constant == 'locations'){
						for(var i = 0; i < data.length; i++){
							if(data[i].name == "Names & Numbers")
								localStorageService.set("NamesNumbers", data[i].id);
						}
					}
				});
			});

			//Cache special statuses
			//Job log
			localStorageService.set("Manager_Completed_Log", 1);
			localStorageService.set("Prep_Completed_Log", 3);
			localStorageService.set("Printer_Started_Log", 4);
			localStorageService.set("Printer_Completed_Log", 5);
			localStorageService.set("QC_Completed_Log", 6);

			//Print Log
			localStorageService.set("Press_Started_PrintLog", 3);
			localStorageService.set("Printer_Completed_Regular_PrintLog", 4);
			localStorageService.set("QC_Completed_Regular_PrintLog", 5);
			localStorageService.set("Printer_Completed_NN_PrintLog", 7);
			localStorageService.set("QC_Completed_NN_PrintLog", 8);

			//Count of Special Log
			localStorageService.set("Manager_Pending_Log_Count", 1);
			localStorageService.set("Prep_Pending_Log_Count", 2);
			localStorageService.set("Printer_Pending_Log_Count", 4);
			localStorageService.set("Printer_Started_Log_Count", 5);

			//Count of Special Print Log
			localStorageService.set("Printer_Regular_PrintLog_Count", 5);
			localStorageService.set("Printer_NN_PrintLog_Count", 2);
			localStorageService.set("QC_Regular_PrintLog_Count", 6);
			localStorageService.set("QC_NN_PrintLog_Count", 3);
		},

		logoff: function(){
			localStorageService.set("authenticated", "false");
			$location.path('login');
		},

		overview: function(isOverview){
			if(!isOverview)
				$location.path('' + localStorageService.get('user').name + '/jobs');
		}
	}	
})

.factory('Helpers', function(localStorageService) {
	return{
		//find if a job should be pushed into the job list of a staff based on facility ID
		facilityIdCompare: function(staff, job){
			if(staff.facility_id.indexOf(job.facility_id) > -1){
				return true;
			}
			return false;
		},

		//find if a specific prep or printer is in the staff list of a job
		isStaffinJob: function(staff, job){
			for(var i = 0; i < job.staff.length; i++){
				if(job.staff[i].staff_id == staff.id)
					return true;
			}
			return false;
		},

		//Find if the job is in the job list
		isJobinJoblist: function(jobid, joblist){
			for(var i = 0; i < joblist.length; i++){
				if(joblist[i].id == jobid)
					return true;
			}
			return false;
		},

		isJobPending: function(user, job){
			if(user.role_id == localStorageService.get("Manager") && job.log.length == localStorageService.get("Manager_Pending_Log_Count"))
				return "Pending";
			else if(user.role_id == localStorageService.get("QC") && this.isJobReadyForQC(job))
				return "Pending";
			else if(user.role_id == localStorageService.get("Prep") && job.log.length == localStorageService.get("Prep_Pending_Log_Count"))
				return "Pending";
			else if(user.role_id == localStorageService.get("Printer") && job.log.length == localStorageService.get("Printer_Pending_Log_Count"))
				return "Pending";
			else
				return "";
		},

		//Traverse the print log of every print location, if any one has its printing complete, it is ready for QC
		isJobReadyForQC: function(job){
			var locations = job.location;
			for(var i = 0; i < locations.length; i++){
				if(locations[i].location_id == localStorageService.get("NamesNumbers"))
					var length = localStorageService.get("Printer_NN_PrintLog_Count");
				else
					var length = localStorageService.get("Printer_Regular_PrintLog_Count");
				if(locations[i].printlog != undefined && locations[i].printlog.length == length)
					return true;
			}
			return false;
		},

		//Check if the location is complete
		isLocationComplete: function(roleid, location){
			if(location.printlog == undefined || location.printlog == [])
				return false;
			if(localStorageService.get("QC") == roleid){
				var nnLength = localStorageService.get("QC_NN_PrintLog_Count");
				var regularLength = localStorageService.get("QC_Regular_PrintLog_Count");
			}
			//Actually role == "Printer"
			else{
				var nnLength = localStorageService.get("Printer_NN_PrintLog_Count");
				var regularLength = localStorageService.get("Printer_Regular_PrintLog_Count");
			}

			//Check regular location
			if(location.location_id != localStorageService.get("NamesNumbers")){
				if(location.printlog.length < regularLength)
					return false;
				else
					return true;
			}
			else{
				if(location.printlog.length < nnLength)
					return false;
				else
					return true;
			}

		},

		//Similar to removeItemFromList, but need to use different ID
		removePreview: function(id, list){
			var index = -1;
			for(var i = 0; i < list.length; i++){
				if(list[i].location_id == id){
					index = i;
					break;
				}
			}
			if(index > -1)
				list.splice(index, 1);
		},

		//Function to remove an item from the list based on id
		removeItemFromList: function(id, list){
			var index = -1;
			for(var i = 0; i < list.length; i++){
				if(list[i].id == id){
					index = i;
					break;
				}
			}
			if(index > -1)
				list.splice(index, 1);
		},

		replaceItemFromList: function(element, list){
			var index = -1;
			for(var i = 0; i < list.length; i++){
				if(list[i].id == element.id){
					index = i;
					break;
				}
			}
			//Make sure the replace is done by clone, not point to the reference
			if(index > -1)
				list[index] = JSON.parse(JSON.stringify(element));
		},

		//getStaffByID from local array
		getObjectById: function(id, list){
			for(var i = 0; i < list.length; i++){
				if(list[i].id == id)
					return list[i];
			}
			return null;
		},

		//getStaffByName from local array
		getObjectByName: function(name, list){
			for(var i = 0; i < list.length; i++){
				if(list[i].name == name)
					return list[i];
			}
			return null;
		},

		//find the responsible user of particular role
		findAssignedStaff: function(roleid, staffList){
			for(var i = 0; i < staffList.length; i++){
				if(staffList[i].role_id == roleid){
					return staffList[i];
				}
			}
			return null;
		},

		//Check if the printer has "Names & Numbers" job
		hasNamesNumbers: function(job, nnid){
			for(var i = 0; i < job.location.length; i++){
				if(job.location[i].location_id == nnid)
					return true;
			}
			return false;
		},

		//Check if the job has a Pending badge
		hasPending: function(job, joblist){
			for(var i = 0; i < joblist.length; i++){
				if(joblist[i].id == job.id){
					// if(joblist[i].pending == undefined || joblist[i].pending == "" || joblist[i].pending == null || joblist[i])
					if(joblist[i].pending == undefined || joblist[i].pending != "Pending")
						return false;
					else
						return true;
				}
			}
		},

		//Check if printing of a job is started based on print log
		checkQCStart: function(job){
			var locations = job.location;
			for(var i = 0; i < locations.length; i++){
				if(this.isLocationComplete(localStorageService.get("QC"), locations[i]))
					return true;
			}
			return false;
		},

		//Check if printing of all locations of a job is completed based on print log
		checkPrintingComplete: function(job, roleid, locationid){
			var locations = job.location;
			// var isComplete = true;
			// if(localStorageService.get("QC") == roleid){
			// 	var nnLength = 3;
			// 	var regularLength = 6;
			// }
			// //Actually role == "Printer"
			// else{
			// 	var nnLength = 2;
			// 	var regularLength = 5;
			// }

			for(var i = 0; i < locations.length; i++){
				if(locations[i].location_id != locationid){
					if(this.isLocationComplete(roleid, locations[i]) == false)
						return false;
					// if(locations[i].location_id != localStorageService.get("NamesNumbers")){
					// 	if(locations[i].printlog.length < regularLength){
					// 		isComplete = false;
					// 		break;
					// 	}
					// }
					// else{
					// 	if(locations[i].printlog.length < nnLength){
					// 		isComplete = false;
					// 		break;
					// 	}
					// }
				}
			}
			return true;
		},

		//Functions to update the number of the pending num in local storage. 
		incrementPendingnum: function(){
			if(localStorageService.get('pendingnum') == "" || localStorageService.get('pendingnum') == null){
				localStorageService.set('pendingnum', 0);
			}
			var pendingnum = localStorageService.get('pendingnum');
			localStorageService.set('pendingnum', parseInt(pendingnum) + 1);
		},

		decrementPendingnum: function(){
			var pendingnum = localStorageService.get("pendingnum");
			if(pendingnum == "" || pendingnum == undefined || pendingnum == null)
				return;
			pendingnum = parseInt(pendingnum) - 1;
			if(pendingnum == 0)
				pendingnum = "";
			localStorageService.set("pendingnum", pendingnum);
		}, 

		//Add new job log to the $rootScope.jobs
		addJobLog: function(log, joblist){
			var jobid = log.job_id;
			for(var i = 0; i < joblist.length; i++){
				//For the user who create this log, the log will be added to his log directly.
				//So joblist[i].log.length == log.job_status_id can prevent the same log from being added twice.
				if(joblist[i].id == jobid && joblist[i].log.length == log.job_status_id){
					joblist[i].log.push(log);
					return;
				}
			}
		},

		//Add new job log to the $rootScope.joblogs which is displayed on screen
		//job here is $rootScope.job
		addJobLogView: function(log, joblogview){
			var logname = this.getObjectById(log.job_status_id, localStorageService.get("logstatuses")).name;
			var logicon = "";
			var length = joblogview.length;
			joblogview[length - 1].icon = "ion-checkmark";
			if(log.job_status_id == localStorageService.get("QC_Completed_Log"))
				logicon = "ion-checkmark-circled";
			else if(log.job_status_id == localStorageService.get("Manager_Completed_Log") || log.job_status_id == localStorageService.get("Prep_Completed_Log") || log.job_status_id == localStorageService.get("Printer_Completed_Log"))
				logicon = "ion-checkmark";
			else
				logicon = "ion-arrow-right-a";
			joblogview.push({
				"name": logname,
				"icon": logicon
			});
		},

		//Add new print log to the $rootScope.jobs
		addPrintLog: function(log, joblist){
			var jobid = log.job_id;
			var locationid = log.location_id;
			for(var i = 0; i < joblist.length; i++){
				if(joblist[i].id == jobid){
					for(var j = 0; j < joblist[i].location.length; j++){
						if(joblist[i].location[j].location_id == locationid){
							if(locationid != localStorageService.get("NamesNumbers") && joblist[i].location[j].printlog.length == log.print_status_id){
								joblist[i].location[j].printlog.push(log);
								return;
							}
							else if(locationid == localStorageService.get("NamesNumbers") && joblist[i].location[j].printlog.length == log.print_status_id - localStorageService.get("QC_Regular_PrintLog_Count")){
								joblist[i].location[j].printlog.push(log);
								return;
							}
						}
					}
				}
			}
		},

		//Add new print log to the $rootScope.printlogs which is displayed on screen
		addPrintLogView: function(log, printlogview){
			var logname = this.getObjectById(log.print_status_id, localStorageService.get("printstatuses")).name;
			var logicon = "";
			var length = printlogview.length;
			if(log.location_id != localStorageService.get("NamesNumbers")){
				if(log.print_status_id == localStorageService.get('QC_Completed_Regular_PrintLog'))
					logicon =  "ion-checkmark-circled";
				else
					logicon =  "ion-checkmark";
			}
			else{
				if(log.print_status_id == localStorageService.get('QC_Completed_NN_PrintLog'))
					logicon =  "ion-checkmark-circled";
				else
					logicon =  "ion-checkmark";
			}
			printlogview.push({
				"name": logname,
				"icon": logicon
			});
		},

		makePreviewReady: function(previews, locationid){
			for(var i = 0; i < previews.length; i++){
				if(previews[i].location_id == locationid){
					previews[i].ready = true;
					return;
				}
			}
		}
	}
})

.factory('Api', function($http, $resource, localStorageService){
	return{
		//Get All Kinds of Data
		getData: function(datatype){
			var url = "data/" + datatype + ".json";
			var cache = ["jobs", "staffs"];
			if(cache.indexOf(datatype) > -1){
				return $resource(url, {}, {
					query: {
						method: "GET",
						cache: true,
						isArray: true
					}
				});
			}
			return $resource(url, {}, {
				query: {
					method: "GET",
					cache: false,
					isArray: true
				}
			});
		},

		//Get Staff Functions
		//Return all the data first, then select from it with other functions
		getStaffs: function(){
			var url = 'data/staffs.json';
			return $resource(url);
		},
		getStaffByFacility: function(facilityid){
			var url = 'data/staffs.json';
			$http.get(url).success(function(data){
				var result = [];
				for(var i = 0; i < data.length; i++){
					if(data[i].facilityid == facilityid){
						result.push(data[i]);
					}
				}
				return result;
			});
		}, 
		getStaffById: function(id){
			var url = 'data/staffs.json';
			$http.get(url).success(function(data){
				var result = [];
				for(var i = 0; i < data.length; i++){
					if(data[i].id == id){
						result.push(data[i]);
					}
				}
				return result;
			});
		}, 
		assignStaffs: function(staffs, job){
			for(var i = 0; i < staffs.length; i++){
				job.staff.push({
					"id": job.staff.length,
					"job_id": job.id,
					"staff_id": staffs[i].id,
					"role_id": staffs[i].role_id
				});
			}
			job.log.push({
				"id": job.log.length,
				"job_id": job.id,
				"job_status_id": localStorageService.get("Manager_Completed_Log")
			});

			var post = this.getData("jobs").query(function(){				
				angular.forEach(staffs, function(staff){
					for(var i = 0; i < post.length; i++){
						// alert(i);
						if(post[i].id == job.id){
							// alert(post[i].name);
							// post[i].name = "changed";
							// alert(JSON.stringify(post[i].$save()));	
							// alert(JSON.stringify(post[i]));
							alert(i + " before: " + JSON.stringify(post[i]));
							post[i].staff.push(staff);
							post[i].$save();	//This $save() can't update the local json file. Not sure if it can update the remote server data. 
							alert(i + " after: " + JSON.stringify(post[i]));						
							continue;
						}
					}
				});
			});
		},				
		//getStaffByName $http version
		// getStaffByName: function(name){
		// 	var func = function(){
		// 		var url = 'data/staffs.json';
		// 		var promise = $http.get(url);
		// 		return promise;
		// 	};
		// 	return func().then(function(response){
		// 		for(var i = 0; i < response.data.length; i++){
		// 			if(response.data[i].name == name){
		// 				return response.data[i];
		// 			}
		// 		}
		// 	});
		// }, 
		
		getStaffByJob: function(jobid){
			var url = 'data/jobs.json';
			$http.get(url).success(function(data){
				for(var i = 0; i < data.length; i++){
					if(data[i].id == jobid){
						return data[i].staff;
					}
				}
				return null;
			});
		}, 

		//GetJob Functions
		getJobs: function(){
			var url = 'data/jobs.json';
			return $resource(url);
		},

		getJobByFacility: function(facilityid){
			var url = 'data/jobs.json';
			$http.get(url).success(function(data){
				var result = [];
				for(var i = 0; i < data.length; i++){
					if(data[i].facilityid == facilityid){
						result.push(data[i]);
					}
				}
				return result;
			});
		},
		getJobByStaff: function(staffid){
			var url = 'data/jobs.json';
			var promise = $http.get(url).success(function(data){
				var result = [];
				for(var i = 0; i < data.length; i++){
					for(var j = 0; j < data[i].staff.length; j++){
						if(data[i].staff[j].staffid == staffid){
							result.push(data[i].staff[j]);
							break;
						}
					}
				}
				return result;
			});
			return promise;
		},
		getJobById: function(jobid){
			var url = 'data/jobs.json';
			$http.get(url).success(function(data){
				var result = [];
				for(var i = 0; i < data.length; i++){
					if(data[i].id == jobid){
						return data[i];
					}
				}
				return null;
			});
		},

		//getRoles $http version
		// getRoles: function(){
		// 	var url = 'data/roles.json';
		// 	var promise = $http.get(url).success(function(data){
		// 		return data;
		// 	});
		// 	return promise;
		// }

		//getRoles $resource version
		getRoles: function(){
			var url = 'data/roles.json';
			return $resource(url);
			// var promise = $http.get(url).success(function(data){
			// 	return data;
			// });
			// return promise;
		}
	}
})

.factory('socket', function($rootScope){
	/* Locate socket IO server via the ip and port*/
    var socket = io.connect("http://127.0.0.1:3000");
    // socket.on('disconnect', function(){alert("Disconnect")});
    // socket.on('connect', function(){alert("Connect"); alert(socket.io.engine.id);});
    // socket.on('reconnect', function(){alert("Reconnect")});
    // socket.on('reconnecting', function(){alert("Reconnecting")});

    return {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
})

.factory('httpCache', function($http, $cacheFactory){
	var $httpDefaultCache = $cacheFactory.get('$http');  
	return{
		add: function(url, element){
			var cachedData = $httpDefaultCache.get(url);
			if(cachedData == undefined)
				return;
			var data = JSON.parse(cachedData[1]);
			data.push(element);
			cachedData[1] = JSON.stringify(data);
		}, 
		update: function(url, element){
			var cachedData = $httpDefaultCache.get(url);
			if(cachedData == undefined)
				return;
			var data = JSON.parse(cachedData[1]);
			var index = 0;
			for(var i = 0; i < data.length; i++){
				if(data[i].id == element.id){
					index = i;
					break;
				}
			}
			data.splice(index, 1, element);
			cachedData[1] = JSON.stringify(data);
		}, 
		//Remove by id, not modify which is
		remove: function(url, id){
			var cachedData = $httpDefaultCache.get(url);
			if(cachedData == undefined)
				return;
			var data = JSON.parse(cachedData[1]);
			var index = 0;
			for(var i = 0; i < data.length; i++){
				if(data[i].id == id){
					index = i;
					break;
				}
			}
			data.splice(index, 1);
			cachedData[1] = JSON.stringify(data);
		},

		get: function(url){
			var cachedData = $httpDefaultCache.get(url);
			if(cachedData == undefined)
				return null;
			return JSON.parse(cachedData[1]);
		}
	};
});


var ROLES = ["Prep", "Printer", "QC", "Manager"];
