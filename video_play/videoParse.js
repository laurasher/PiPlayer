// - - - - - - - - - - - - - - - - -
// - Parse a video from command line
// - Get pixel data
// - Send out rgb values to server
// - - - - - - - - - - - - - - - - -

//====================
// SETUP
//====================

var ffmpeg = require('fluent-ffmpeg');
var getPixels = require('get-pixels');
// Require kinetServer module
var kinetServer = require('./kinetServer.js');


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
  .takeScreenshots({ count: 2, timemarks: [ '00:00:02.000', '6'] }, '/Users/lasher/Sosolimited/PiPlayer/video_play/exported');


//====================
// Get pixel data
//====================

	getPixels('/Users/lasher/Sosolimited/PiPlayer/video_play/exported/tn_1.png', function(err, pixels){
		if (err){
			console.log(err);
			return;
		} else {
			console.log(pixels.data);
		}
	});


//====================
// Send out rgb values
//====================

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
	client.socket.on('frame', function(data) {

		var rows = data.height;
		var cols = data.width;
		var lightStrand = data.pixels;

		// Format lightstrand for either Boston or San Diego
		if(config.location==="BOS"){
			lightStrand = bostonLightConfig(rows, cols, lightStrand).slice();

			client.kinetServer.sendKinetData( lightStrand.slice(0,150), config.kinetIP, 3);
			client.kinetServer.sendKinetData( lightStrand.slice(150,300), config.kinetIP, 1 );
			client.kinetServer.sendKinetData( lightStrand.slice(300,lightStrand.length), config.kinetIP, 2);

		}else{
			lightStrand = SDLightConfig(rows, cols, lightStrand.slice(0,144)).slice();

			client.kinetServer.sendKinetData( lightStrand, config.kinetIP, 1 );
		}

	});
