var express = require('express');
var app = module.exports = express();

var server = require('http').createServer(app);

// Hook Socket.io into Express
var io = require('socket.io').listen(server);

// Socket.io Communication
var socket = require('./scripts/socket.js');

// io.sockets.on('connection', socket);
//The code below are added for testing socket.io of prodApp
var job = "{\"id\": 554120,\"name\": \"vidhyachrometest\", \"facility_id\": 2,\"location\": [], \"staff\": [],\"log\": []}";
var dataJob = JSON.parse(job);
var dataMessage = JSON.parse("{\"job_id\": 554114, \"message\": \"This is a message for staff related to job 554114\"}");
var dataChange = JSON.parse("{\"job\": " + job + ", \"staff_id\": 0, \"add\": false}");
var user = JSON.parse("{\"id\": 0,\"name\": \"Tim\", \"facility_id\": 0,\"role_id\": 0}");
var log = JSON.parse("{\"id\": 0,\"job_id\": \"554114\", \"job_status_id\": 5}");
var log2 = JSON.parse("{\"id\": 0,\"job_id\": \"554114\", \"job_status_id\": 6}");
var printlog = JSON.parse("{\"id\": 0,\"job_id\": \"554114\", \"location_id\": 0, \"print_status_id\": 4}");
var printlog2 = JSON.parse("{\"id\": 0,\"job_id\": \"554114\", \"location_id\": 10, \"print_status_id\": 8}");

var viewers = [];


io.sockets.on('connection', function(socket){
	console.log("Connection " + socket.id + " accepted.");
	console.log('connection', socket);
	socket.emit('job:received', dataJob);
	// console.log(222);
	// socket.emit('job:broadcast', dataMessage);
	// socket.emit('job:changed', dataJob);
	// socket.emit('staff:authenticated', user);
	// socket.emit('job:staff:changed', dataChange);
	// socket.emit('job:log:changed', log);
	// socket.emit('job:log:changed', log2);
	// socket.emit('job:location:changed', printlog);
	// console.log(111);
	// socket.emit('job:location:changed', printlog2);
	socket.on('disconnect', function(){
		console.log("Connection " + socket.id + " terminated.");
	});
	socket.on('client:job:opened', function(data){
		console.log("Entered:\n" + JSON.stringify(data));
		viewers.push(data.user);
		socket.broadcast.emit("client:job:opened", viewers);
		// fn(viewers);
	});
	socket.on('client:job:closed', function(data){
		console.log("Left:\n" + JSON.stringify(data));
		var index = -1;
		for(var i = 0; i < viewers.length; i++){
			if(viewers[i].id == data.user.id){
				index = i;
				break;
			}
		}
		if(index > -1)
			viewers.splice(index, 1);
		socket.broadcast.emit("client:job:closed", viewers);
	});
});



// Start server 外部访问 http://127.0.0.1:3000
server.listen(3000, function() {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});