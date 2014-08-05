var express = require('express');
var app = module.exports = express();

var server = require('http').createServer(app);

// Hook Socket.io into Express
var io = require('socket.io').listen(server);

// Socket.io Communication
var socket = require('./scripts/socket.js');

// io.sockets.on('connection', socket);
//The code below are added for testing socket.io of prodApp
var job = "{\"id\": 554133,\"name\": \"vidhyachrometest\", \"facility_id\": 2,\"location\": [], \"staff\": [],\"log\": []}";
var dataJob = JSON.parse(job);
var dataMessage = JSON.parse("{\"job_id\": 554114, \"message\": \"This is a message for staff related to job 554114\"}");
var dataChange = JSON.parse("{\"job\": " + job + ", \"staff_id\": 2, \"add\": false}");


io.sockets.on('connection', function(socket){
	console.log('connection', socket);
	socket.emit('job:received', dataJob);
	// socket.emit('job:broadcast', dataMessage);
	// socket.emit('job:staff:changed', dataChange);
});

// Start server 外部访问 http://127.0.0.1:3000
server.listen(3000, function() {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
