// Send out RGB values for 50 ck node lights

// - - - - - - - - - - - - - - -
// Soso Lighting Client
//
// A Simple Node Client
//
// Fetches lighting frames from StudioLights Server
// Converts data format to KiNet data packet
// Sends lighting data to KiNet hardware via UDP (using kinetServer)


// - - - - - - - - - - - - - - -
// SETUP
// - - - - - - - - - - - - - - -

// Require kinetServer module
var kinetServer = require('./kinetServer.js');


// - - - - - - - - - - - - - - -
// Frame Client Factory Function
// - - - - - - - - - - - - - - -
//while(1){
// Create FrameClient (immediately executed)
var createFrameClient = function() {

// - - - - - - - - - - - - - - -
// Helper functions
// - - - - - - - - - - - - - - -

	function reverseArray(arr, start, end){
		var temp;
		if (start >= end){
			return;
		}
		temp = arr[start];
		arr[start]=arr[end];
		arr[end]=temp;
		reverseArray(arr, start+1, end-1);
	}


// - - - - - - - - - - - - - - -
// Create Client
// - - - - - - - - - - - - - - -

	// first check for config.js, which needs to be created manually
	// at each location (base it on config-default.js)
	var fs = require('fs');

	if( !fs.existsSync('./config.js') ){
		console.log( "\nError: config.js not found! Copy config-default.js to config.js and change values as needed.\n" );
		return;
	}

	var config = require('./config.js');

	var client = {};

	// Create KiNet server for sending data to lights
	client.kinetServer = kinetServer.createKinetServer();

	// Connect to local running server instance
	// TODO: Update to use remote server after deployment
	client.socket = require('socket.io-client')(config.server, {query: 'location='+config.location});
	client.frameCount = 0;

	// Letting us know when we connect.
	client.socket.on('connect', function(){
		console.log("Connected to Frame Server");
	});

	// Letting us know when we disconnect.
	client.socket.on('disconnect', function(){
		console.log("Disconnected from Frame Server");
	});


	// On the frame event make a write out.
	function playRandomData(){
		var rows = 8;
		var cols = 6;

		// Generate light strand
		var lightStrand = new Array(150 +1 );
		for(var i=0;i<150;i+=3){
			lightStrand[i] = Math.floor((Math.random() * 100) + 10);
			lightStrand[i+1] = Math.floor((Math.random()*100) + 10);
			lightStrand[i+2] = 100;
		}

		client.kinetServer.sendKinetData( lightStrand, config.kinetIP, 1 );


		console.log(lightStrand);
}
	client.socket.on('frame', function(data){
		playRandomData();
		sleep(10000000000000000);
});
}();

	function sleep(milliseconds){
	   console.log("waiting");
	   var start = new Date().getTime();
	   for(var i = 0; i < 1e7; i++){
	     if((new Date().getTime() - start) > milliseconds){
		break;
	     }
	   }
	}
		// sleep(10000000000000000);
//}
