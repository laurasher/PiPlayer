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

	// Order incoming pixels using Boston lighting configuration
	// Boston lights snake up from bottom left of matrix
	/*
	function bostonLightConfig(R, C, Arr){

		// Transform array into matrix coordinates
		var rLength = C*3; //row length = num of pixel columns * the three R,G, & B values
		var array = Arr;
		var flip = 0;

		reverseArray(array, 0, (array.length-1));

		for (var i = 0; i < R; i++) {
					var start = i*rLength;
					if(i>4&&i<10){
						flip = 1;
					}else{
						flip=0;
					}

					if (i%2===flip) {
							reverseArray(array, start, i*rLength+rLength-1);
				}   else {
							for (var n = start; n < start+rLength-2; n=n+3) {
								reverseArray(array, n, n+2);
							}
					}
				}
			//returns array of rgb values formatted for boston sudiolight configuration

			return array;
	}
*/
	// Order incoming pixels using San Diego lighting configuration
	// San Diego lights
	function SDLightConfig(R, C, Arr){

		var emptyValues=[0,0,0,0,0,0];
		var rLength = C*3; //row length = num of pixel columns * the three R,G, & B values
		var array = Arr;

		//reverseArray(array, 0, (array.length-1));

		 for (var i = 0; i < R; i++) {
			var start = i*rLength;
			if (i%2==0) {
				reverseArray(array, start, i*rLength+rLength-1);
				for (var n = start; n < start+rLength-2; n=n+3) {
					reverseArray(array, n, n+2);
				}
			}
		}
		//returns
		return emptyValues.concat(array);
	}


	function logConfig(columns, Array){

		if(config.location==="SAN"){
		var colorArray = Array.slice(6,150);
		}else{
		var colorArray = Array.slice();
		}
		console.log('\n');
		for (var i = 0; i < colorArray.length; i++) {
				if (i%(columns*3)==0) {
						console.log('\n');
				}
				process.stdout.write("["+i+"]"+colorArray[i] + " ");
			}
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

	function sleep(milliseconds){
	   console.log("waiting");
	   var start = new Date().getTime();
	   for(var i = 0; i < 1e7; i++){
	     if((new Date().getTime() - start) > milliseconds){
		break;
	     }
	   }
	}


	// On the frame event make a write out.
	//client.socket.on('frame', function(data) {
	function playRandomData(){
		// var rows = data.height;
		// var cols = data.width;
		var rows = 8;
		var cols = 6;
		// var lightStrand = data.pixels;


		/////////////// Send data here ///////////////
		// Generate light strand
		var lightStrand = new Array(150 +1 );
		// while(1){
		for(var i=0;i<150;i+=3){
			lightStrand[i] = Math.floor((Math.random() * 100) + 10);
			lightStrand[i+1] = Math.floor((Math.random()*100) + 10);
			lightStrand[i+2] = 100;
		}

		//lightStrand = SDLightConfig(rows, cols, lightStrand.slice(0,144)).slice();
		while(1){
					for(var i=0;i<150;i+=3){
							lightStrand[i] = Math.floor((Math.random() * 100) + 10);
							lightStrand[i+1] = Math.floor((Math.random()*100) + 10);
							lightStrand[i+2] = 100;
					}
		client.kinetServer.sendKinetData( lightStrand, config.kinetIP, 1 );
		sleep(1000);
		}

		console.log(lightStrand);
		// }
	}
while(1){
		playRandomData();
//		sleep(1000);
	}
		//////////////////////////////////////////////

		// Format lightstrand for either Boston or San Diego
		/*
		if(config.location==="BOS"){
			lightStrand = bostonLightConfig(rows, cols, lightStrand).slice();

			client.kinetServer.sendKinetData( lightStrand.slice(0,150), config.kinetIP, 3);
			client.kinetServer.sendKinetData( lightStrand.slice(150,300), config.kinetIP, 1 );
			client.kinetServer.sendKinetData( lightStrand.slice(300,lightStrand.length), config.kinetIP, 2);

		}else{
			lightStrand = SDLightConfig(rows, cols, lightStrand.slice(0,144)).slice();

			client.kinetServer.sendKinetData( lightStrand, config.kinetIP, 1 );
		}
*/
			//log values in console in row/column format
			// logConfig(6, 8,lightStrand);
	// });
}();
