angular.module('starter.services', [])
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

.factory('Account', function($location, $cookieStore){
	return{
		login: function(user, password, rolename){
			$cookieStore.put("user", user);
			$cookieStore.put("password", password);
			$cookieStore.put("rolename", rolename);
			$cookieStore.put("authenticated", "true");
			// $cookieStore.put("roles", $scope.roles);
			$location.path('/' + user.name + '/jobs');
		},

		logoff: function(){
			$cookieStore.put("authenticated", "false");
			global = {};
			$location.path('/login');
		},

		overview: function(isOverview){
			if(!isOverview)
				$location.path('/' + $cookieStore.get('user').name + '/jobs');
		}
	}	
})

.factory('Helpers', function() {
	return{
		facilityIdCompare: function(staff, job){
			if(staff.facility_id.indexOf(job.facility_id) > -1){
				return true;
			}
			return false;
		}
	}
})

.factory('Api', function($http, $resource){
	return{
		//Get All Kinds of Data
		getData: function(datatype){
			var url = "data/" + datatype + ".json";
			return $resource(url, {}, {
				query: {
					method: "GET",
					cache: true,
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

		//getStaffByName $resource version
		getStaffByName: function(username, users){
			for(var i = 0; i < users.length; i++){
				if(users[i].name == username)
					return users[i];
			}
			return null;
			// var url = 'data/staffs.json';
			// var users = $resource(url);
			// func = users.query(function(){
			// 	alert("func: " + func);
			// 	for(var i = 0; i < func.length; i++){
			// 		if(func[i].name == username){
			// 			func = func[i];
			// 			break;
			// 		}
			// 	}
			// 	alert("new func: " + func.name);
			// });
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
});

// .factory('Previews', function() {
// 	var jobs = [
// 		{id: 554114, name: "names and numbers"},
// 		{id: 554120, name: "cart-sizeup-test"},
// 		{id: 554133, name: "gingerbreadman-test 2"},
// 		{id: 554790, name: "franklin family"},
// 		{id: 554803, name: "testingdevtest"},
// 		{id: 554804, name: "flagtest"},
// 		{id: 554810, name: "254"},
// 		{id: 554814, name: "vidhyachrometest"},
// 	];

// 	return{
// 		all: function(){
// 			return jobs;
// 		}
// 	}
// });


var ROLES = ["Prep", "Printer", "QC", "Manager"];
