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

        // In order to "ping-pong" or "boomerang" the buffer we traverse the buffer
        // from negative its length to positive its length.
        // With the absolute value it looks like 5,4,3,2,1,0,1,2,3,4,5
        var curFrame = Math.abs(frameCount[location]);
        socket.emit('frame', pixelBuffer[location][curFrame]);

        // Once the frameCount gets beyond the length positively...
        // we reset the count to the negative length.
        // if the webclient is live the current frame will be 0 for "live" data.
        if ( socketQueue.hasOwnProperty(location) && socketQueue[location].length > 0 ) {
          frameCount[location] = 0;
        } else if ( frameCount[location] >= pixelBuffer[location].length-1 ) {
          frameCount[location] = -( pixelBuffer[location].length - 1 );
        } else {
          frameCount[location]++;
        }
      }
    });

}, 1000 / messageRate);

// Start our HTTP Server
server.listen(clientPORT, function() {
  console.log( 'Http Server listening on port: %s', this.address().port );
});

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

  broadcastClientQueueStatus(socketQueue[currentLocation]);

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

  socket.on('clear display', function(data){
    console.log( "someone wants to clear display for " + data.location );
    var success = clearDisplay(data.location);
    socket.emit('clear success', success);
    socket.disconnect(); //if doesn't work, try putting in clearDisplay function;
  });

  // client requests to cut to front of the queue
  socket.on('cut queue', function( data ){
    var loc = data.location;
    var from_idx = -1;

    // find current position
    socketQueue[loc].forEach(function (item, index, object) {
      if (item.id === socket.id) {
        from_idx = index;
      }
    });

    // move socket to the front
    var element = socketQueue[loc][from_idx];
    socketQueue[loc].splice( from_idx, 1 ); // remove element from array
    socketQueue[loc].splice( 0, 0, element ); // add element back to front of array

    // notify all connected clients of update
    broadcastClientQueueStatus( socketQueue[loc] );

    socket.emit('cut success');
  });

  socket.on('disconnect', function() {
    removeSocketFromQueues(socket);
    console.log("disconnected: " + JSON.stringify(address));
    // updateQueue(currentLocation);
  });
}

function clearDisplay(location) {
  // if pixelBuffer has an array for the given location and no sockets in the location's queue
  if( pixelBuffer.hasOwnProperty(location) && pixelBuffer[location].length > 0 && socketQueue[location].length === 0 ){
    pixelBuffer[location].forEach(function (frame){
      frame.pixels.forEach(function (pixelValue, index){
        frame.pixels[index]= 0;
      });
    });

    return true;
  }
  else {
    return false;
  }
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
      'content': iMessage
    };
    socket.emit('status_update', messagePackage);
  } else {
    console.log("no message emitted... missing params");
  }
}

function removeSocketFromQueues(socket) {
    var location = socket.handshake.query.location;

    socketQueue[location].forEach(function (item, index, object) {
        if (item.id === socket.id) {
            object.splice(index, 1);
        }
    });
    broadcastClientQueueStatus(socketQueue[location]);
}

function broadcastClientQueueStatus(queue){
  queue.forEach( function(socket, index) {
    sendMessage(socket, clientMessageFromIndex(index));
    if(index==0){
      socket.emit("status_update", {"class":"indicator","index":index, "is_live": true});
    }else{
      socket.emit("status_update", {"class":"indicator","index":index, "is_live": false});
    }
  });
}

function clientMessageFromIndex(index){
  if (index===0){
   return 'You are live and at the front of the queue.';
  }else {
    return 'You are currently ' + index + ' from the front of the queue.';
  }
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
