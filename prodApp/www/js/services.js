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
		logoff: function(){
			$cookieStore.put("authenticated", "false");
			$location.path('/login');
		},

		overview: function(){
			$location.path('/' + $cookieStore.get('username') + '/jobs');
		}
	}	
})

.factory('Api', function($http){
	return{
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
		// getAllStaff: function(){
		// 	var url = 'data/staffs.json';
		// 	return $http.get(url).success(function(data){return data;});
		// },
		getStaffByName: function(name){
			var data = getAllStaff();
			alert(data);
			// var url = 'data/staffs.json';
			// var promise = $http.get(url).success(function(data){
			// 	alert("D: " + data);
			// 	return data;
			// });
			// return promise;
			// alert(promise);
			// var result = 1;
			// alert(promise.data);
			// for(var i = 0; i < promise.length; i++){
			// 	if(promise[i].name == name){
			// 		 result = promise[i];
			// 	}
			// }
			// alert("a: " + result);
			// return result;
			// return function(promise){
			// 	for(var i = 0; i < data.length; i++){
			// 		if(data[i].name == name){
			// 			return data[i];
			// 		}
			// 	}
			// };
			// .success(function(data){
			// 	for(var i = 0; i < data.length; i++){
			// 		if(data[i].name == name){
			// 			return data[i];
			// 		}
			// 	}
			// });
			// return promise;
			// alert("result " + result);
			// alert("Promise: " + result);
			// return promise;
		}, 
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

		getRoles: function(){
			var url = 'data/roles.json';
			var promise = $http.get(url).success(function(data){
				return data;
			});
			return promise;
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
