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

.factory('Api', function($http, $resource){
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

		//getStaffByName $resource version
		getStaffByName: function(username){
			var url = 'data/staffs.json';
			alert(url);
			var users = $resource(url);
			// users.query(function(response){
			// 		angular.forEach(response, function(item){
			// 			alert(item.name);
			// 		});
			// 	}
			// );

			users.get({name: username}, function(data){
				alert(data.id);
			}, function(response){alert(123)});
			// user.$promise.then(function(data){alert(data.name);});
			// user = users.get({name: name}, function(){});
			// alert("ID: " + user.id);
			// alert(users.get({name: name}));
			return user;
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
