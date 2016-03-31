// - - - - - - - - - - - - - - -
// SETUP
// - - - - - - - - - - - - - - -
var express = require('express');
var io = require('socket.io');            // module for using sockets.
var http = require('http');
var app = express();
var server = http.Server(app);
var gameloop = require('node-gameloop');    // module to run a loop at a certain FPS setting.

//============
// CONFIGs
//============

const clientPORT = 4677;
const lightPORT = 3000;

// CHANGE THIS TO LENGTH OF VIDEO/NUM_SCREENSHOTS
var messageRate = 30;  // Output to lighting app (fps)
var loggingCycle = 30;  // How often to show message in terminal.

// Setup container for light wall's pixel package.
var pixelBuffer = {};
var maxBufferSize = 10; //in seconds

// All Open Sockets
var lightingSockets = [];
var socketQueue = {};

var frameCount = {};
var stdCount = 0;

console.log("App Message Rate = " + messageRate + " per second");

//=============
// Http Routing
//=============

// Serve up the static web files.
app.use('/', express.static(__dirname + '/../web_client'));

// See the raw pixelBuffer, or use as an http request for the current pixel package.
app.get('/socket', function(req, res) {

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify( pixelBuffer ));

});

//===================
// Initialize Server
//===================

// Start HTTP Socket Listening for web client.
var httpIO = io.listen(server);
// Start Lighting App Socket Listening.
var appIO = io.listen(lightPORT);

// Initial Event for connecting clients.
httpIO.on('connection', clientSocketHandler);
// Initial Event for connecting clients.
appIO.on('connection', lightingAppSocketHandler);

// Start System loop. Paces lighting app messaging to our message rate above.
var systemLoop = gameloop.setGameLoop(function(delta) {

    if (stdCount === messageRate * maxBufferSize) stdCount = 0;
    ++stdCount;

    // Emit data to lighting apps.
    lightingSockets.forEach(function (socket, index) {
      var location = socket.handshake.query.location;
      if (pixelBuffer.hasOwnProperty(location) && pixelBuffer[location].length > 0) {

        if (!frameCount.hasOwnProperty(location)) { frameCount[location] = 0; }

        var curFrame = frameCount[location];
        socket.emit('frame', pixelBuffer[location][curFrame]);

        if ( socketQueue.hasOwnProperty(location) && socketQueue[location].length > 0 || frameCount[location] >= pixelBuffer[location].length-1 ) {
          frameCount[location] = 0;
        } else {
          frameCount[location]++;
        }

      }
// Start our HTTP Server
server.listen(clientPORT, function() {
  // console.log( 'Http Server listening on port: %s', this.address().port );
  //emit a frame here
socket.emit('frame',5);
});
    });

}, 1000 / messageRate);


//=================
// Socket Handling
//================

function clientSocketHandler(socket) {
  var currentLocation = socket.handshake.query.location;

  if ( !socketQueue.hasOwnProperty(currentLocation) ) {
    socketQueue[currentLocation] = [];
  }

  if ( !pixelBuffer.hasOwnProperty(currentLocation) ) {
    pixelBuffer[currentLocation] = [];
  }

  socketQueue[currentLocation].push(socket);

  var address = socket.handshake.address;

  if (socketQueue[currentLocation].length > 1) {
    sendMessage(socket, 'You are currently ' + socketQueue[currentLocation].length + ' from the front of the queue.');
  } else {
    sendMessage( socket, 'You are live and at the front of the queue.');
  }

  console.log("New web connection from " + address + "\n");

  // Spew out the first pixel's color information that's coming in over the network.
  socket.on('client-frame', function (message) {
    // If socket is at the front of the queue
    if (socketQueue[currentLocation][0].id === socket.id) {
      pixelBuffer[currentLocation].unshift(message);

      // if buffer is larger than max buffer size remove the last frame.
      if (pixelBuffer[currentLocation].length > maxBufferSize * messageRate) { pixelBuffer[currentLocation].pop(); }

      if (stdCount % loggingCycle === 0) {
        // noTail(currentLocation + ": " + message.id + " " + message.width + "x" + message.height + " (" + message.pixels[0] + ", " + message.pixels[1] + ", " + message.pixels[2] + ")");
      }

    }
  });

  socket.on('disconnect', function() {
    removeSocketFromQueues(socket);
    console.log("disconnected: " + JSON.stringify(address));
    // updateQueue(currentLocation);
  });
}

function lightingAppSocketHandler(socket) {

  var address = socket.handshake.address;

  lightingSockets.push(socket);

  // console.log(socket.handshake);
  console.log("Lighting App Location: " + socket.handshake.query.location);
  console.log("New connection from " + address + "\n");

  socket.on('disconnect', function() {
    lightingSockets.forEach(function (item, index, object) {
        if (item.id === socket.id) {
            object.splice(index, 1);
        }
    });

    console.log("disconnected: " + JSON.stringify(address));
  });
}

function sendMessage(socket, iMessage, iClass) {
  if (typeof iClass == "undefined") iClass = "flash-success";

  if (socket && iMessage) {
    var messagePackage = {
      'class': iClass,
      'message': iMessage
    };

    socket.emit('message', messagePackage);

  } else {
    console.log("no message emitted... missing params");
  }

}

function removeSocketFromQueues(socket) {
    var location = socket.handshake.query.location;
    // Currently checks both queues.
    socketQueue[location].forEach(function (item, index, object) {
        if (item.id === socket.id) {
            object.splice(index, 1);
        }
    });
}

// Helper Function
function noTail(iString) {
  process.stdout.cursorTo(0);
  process.stdout.clearLine();
  process.stdout.write(iString + "\r");
}

//----------------------------------
// Exit/Close App Handling
//----------------------------------

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) {
      console.log('standard program exit');
      gameloop.clearGameLoop(systemLoop);
      console.log('clean');

    }

    if (err) console.log(err.stack);

    if (options.exit) {
      gameloop.clearGameLoop(systemLoop);
      process.exit();
    }
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

/// END OF APP
