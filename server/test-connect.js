// Using the client version of socket
var socket = require('socket.io-client')('http://localhost:3000', {query: 'location=SAN'});
var frameCount = 0;

// Letting us know when we connect.
socket.on('connect', function(){
	console.log("Connected to Server");
});

// Letting us know when we disconnect.
socket.on('disconnect', function(){
	console.log("Disconnected from Server");
});

// On the frame event make a write out.
socket.on('frame', function(data) {
	++frameCount
	// var parsed = JSON.parse(data);
	if (data == null) {
		console.log(data);
	}
	
	if (data.pixels && frameCount % 30 === 0) {
		process.stdout.write("Frame " + frameCount + " : Data = " + data.pixels[0] +", "+ data.pixels[1] +", "+ data.pixels[2] +"\r");
		if (frameCount >= 108000) frameCount = 0; // Reset Frame Count every hour.
	}
	
});