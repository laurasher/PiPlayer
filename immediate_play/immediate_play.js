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
var ffmpeg = require('fluent-ffmpeg');
var getPixels = require('get-pixels');

//====================
// Print file name
//====================

var args = process.argv.slice(2).toString();
console.log(args);

// take png's from input video
var proc = ffmpeg(args)
  // set the size of your thumbnails
  // setup event handlers
  .on('filenames', function(filenames) {
    console.log('screenshots are ' + filenames.join(', '));
  })
  .on('end', function() {
    console.log('screenshots were saved');
  })
  .on('error', function(err) {
    console.log('an error happened: ' + err.message);
  })
  // take 2 screenshots at predefined timemarks
  .takeScreenshots({ count: 2, timemarks: [ '00:00:02.000', '6'] }, '/Users/lasher/Sosolimited/PiPlayer/immediate_play/exported');


// - - - - - - - - - - - - - - -
// Frame Client Factory Function
// - - - - - - - - - - - - - - -
// Create FrameClient (immediately executed)
var createFrameClient = function() {


// - - - - - - - - - - - - - - -
// Helper functions
// - - - - - - - - - - - - - - -

	var count = 0;

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
	var process = require('child_process');
	var ls = process.fork('server.js');

	if( !fs.existsSync('./config.js') ){
		console.log( "\nError: config.js not found! Copy config-default.js to config.js and change values as needed.\n" );
		return;
	}

	var config = require('./config.js');

	var client = {};

	// Create KiNet server for sending data to lights
	client.kinetServer = kinetServer.createKinetServer();

	// Connect to local running server instance
	client.socket = require('socket.io-client')(config.server, {query: 'location='+config.location});
	client.frameCount = 0;

	// Letting us know  when we connect.
	client.socket.on('connect', function(){
		console.log("Connected to Frame Server");
	});

	// Letting us know when we disconnect.
	client.socket.on('disconnect', function(){
		console.log("Disconnected from Frame Server");
	});

	function playRandomData(){

	var lightStrand = new Array(150 +1 );


	getPixels('/Users/lasher/Sosolimited/PiPlayer/video_play/exported/tn_1.png', function(err, pixels){
		if (err){
			console.log(err);
			return;
		} else {
			var pixelArr = pixels.data;
			var pix = new Array(150 +1 );
			var cnt = 0;
		for(var i=0;i<199;i+=4){
			pix[cnt] = pixelArr[i];
			pix[cnt+1] = pixelArr[i+1];
			pix[cnt+2] = pixelArr[i+2];
			cnt+=3;
		}

		// Generate light strand
		for(var i=0;i<150;i+=3){
			 lightStrand[i] = pix[i];
			 lightStrand[i+1] = pix[i+1];
			 lightStrand[i+2] = pix[i+2];
		}
		client.kinetServer.sendKinetData( lightStrand, config.kinetIP, 1 );
		}
			 console.log(lightStrand);
	});

	}
		client.socket.on('frame', function(data){
		playRandomData();
		count++;
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

