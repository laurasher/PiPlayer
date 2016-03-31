// - - - - - - - - - - - - - - -
// Soso Raspberry Pi Video Player
//
// Takes screenshots from video file
// Converts png's to RGBA pixel data
// Converts pixel data to KiNet data packet
// Sends lighting data to KiNet hardware via UDP (using kinetServer)


// - - - - - - - - - - - - - - -
// Setup
// - - - - - - - - - - - - - - -

// Require kinetServer, ffmpeg, get-pixels modules
var kinetServer = require('./kinetServer.js');
var ffmpeg = require('fluent-ffmpeg');
var getPixels = require('get-pixels');
var gameloop = require('node-gameloop');

// Read in video file name from command line
var args = process.argv.slice(2).toString();
var duration = 0;
// var frameRate = 0;


// - - - - - - - - - - - - - - -
// Compress video, if need be
// - - - - - - - - - - - - - - -
// ffmpeg -i LightCube2.mov -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -vcodec libx264 -crf 200 output3.mp4 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"
// 200 has to do with proportion of compression

// - - - - - - - - - - - - - - -
// Frame Client Factory Function
// - - - - - - - - - - - - - - -

// Create FrameClient (immediately executed)
var createFrameClient = function() {

var screenshot_count = 1;
var duration = 0;
var frameRate = 0;

// First check for config.js, which needs to be created manually
var fs = require('fs');
var config = require('./config.js');
if( !fs.existsSync('./config.js') ){
	console.log( "\nError: config.js not found! Copy config-default.js to config.js and change values as needed.\n" );
	return;
}

ffmpeg.ffprobe(args, function(err, metadata) {
  duration = metadata.format.duration;
  // Set frame rate
  frameRate = Math.floor(config.num_screenshots / Math.floor(duration));
  console.log(frameRate);
});


// - - - - - - - - - - - - - - -
// Create Client
// - - - - - - - - - - - - - - -

	// Create child node process to trigger sending of frames
	// var process = require('child_process');
	// var ls = process.fork('server.js');


	var client = {};

	var proc = ffmpeg(args)
  	// Setup event handlers
  	.on('filenames', function(filenames) {
    	// console.log('Screenshots are ' + filenames.join(', '));
  	})
  	.on('end', function() {
    	console.log('Screenshots were saved');
  	})
  	.on('error', function(err) {
    	console.log('An error happened: ' + err.message);
  	})
  	// Take num_screenshots screenshots at predefined timemarks
  	.takeScreenshots(config.num_screenshots, '/Users/lasher/Sosolimited/PiPlayer/immediate_play/exported');

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

	// Function that talks to kinetServer to send pixel data to lights
	function sendPixelsToLights(screenshot_count){
	var lightStrand = new Array(config.num_lights * 3 + 1 );
	var file_string = '/Users/lasher/Sosolimited/PiPlayer/immediate_play/exported/tn_' + screenshot_count + '.png';

	// Get pixel data from the png's
	getPixels(file_string, function(err, pixels){
		if (err){
			// console.log(err);
			return;
		} else {
			var pixelArr = pixels.data;
			var pix = new Array(config.num_lights * 3 + 1 );
			var cnt = 0;

		//Get rid of alpha value in pixel array
		for(var i=0; i<config.num_lights * 3 * 2; i+=4){
			pix[cnt] = pixelArr[i];
			pix[cnt+1] = pixelArr[i+1];
			pix[cnt+2] = pixelArr[i+2];
			cnt+=3;
		}

		// Generate light strand
		for(var i=0; i<config.num_lights * 3 + 1 ; i+=3){
			 lightStrand[i] = pix[i];
			 lightStrand[i+1] = pix[i+1];
			 lightStrand[i+2] = pix[i+2];
		}

		// Send pixel data
		client.kinetServer.sendKinetData( lightStrand, config.kinetIP, 1 );
		}
			 // console.log(lightStrand);
	});
	}

// start the loop at 30 fps (1000/30ms per frame) and grab its id
var frameCount = 0;
var id = gameloop.setGameLoop(function(delta) {
	// `delta` is the delta time from the last frame
		if (screenshot_count > config.num_screenshots){
			screenshot_count = 1;
		}
		sendPixelsToLights(screenshot_count);
		screenshot_count++;
		// frameRate = Math.floor(config.num_screenshots / Math.floor(duration));
	// console.log(frameRate);
}, frameRate);


}();


