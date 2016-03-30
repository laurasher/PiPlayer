// - - - - - - - - - - - - - - -
// KiNet Server
//
// Connects to KiNet power supply via UDP
// Creates KiNet data packet
// Note: UDP must use port 6038 to communicate with KiNet!

module.exports = {

	createKinetServer : function() {

		// Require UDP module
		var dgram = require('dgram');

		console.log("Creating KiNet Lighting server!");

		var kinetServer = {};
		kinetServer.socket = dgram.createSocket('udp4');

		// Creates properly formatted header data
		// TODO: Could expand this for variable strand length
		// Currently defaults to 50 nodes
		var getHeaderData = function( iPort ){

		var header = [ 0x04, 0x01, 0xDC, 0x4A,  // magic number
	    0x02, 0x00,                       // KiNet version
	    0x08, 0x01,                       // Packet type
	    0x00, 0x00, 0x00, 0x00,
	    0xFF, 0xFF, 0xFF, 0xFF, 			// universe, FFFF FFFF is "don't care"
	    iPort,                             // Port on device controller -- TODO: port will need to be set when using sPDS-480-24V
	    0x00,                             // pad, unused
	    0x01, 0x00,                       // Flags, originally 0x01,0x00, 04 00 for sync
	    150, 0x00,                  	// Set length, setting to 150 (send all values)
	    0x00, 0x00];

		return header;

		}


		kinetServer.sendKinetData = function( iPixelData, ipAddress, iKinetPort ){

			// If pixel data is too long, clip array
			if ( iPixelData.length > 150 ){

				// console.log("Warning: Pixel data array is too long.  Clipping to 150 pixel values.");
				iPixelData = iPixelData.slice(0, 150);

			// If pixel data is too short, pad array
			}else if ( iPixelData.length < 150 ){

				console.log("Warning: Pixel data array is too short.  Padding to 150 pixel values.");

				var padding = 150 - iPixelData.length;
				var paddingArray = new Array( padding + 1).join('0').split('').map(parseFloat);

				iPixelData = iPixelData.concat( paddingArray );
			}

			// Compose and send KiNet data packet
			var writeData = function( iPort, iPayload ) {

				var header = getHeaderData( iPort );

				// Combine KiNet header data with payload
				var dataPacket = header.concat( iPayload );
				var message = new Buffer( dataPacket );


				// Note: KiNet data MUST be sent over port 6038!
				kinetServer.socket.send( message, 0, message.length, 6038, ipAddress, function(err) {

					if (err){

						kinetServer.socket.close();
						throw err;
					}
				});
			};

			writeData( iKinetPort, iPixelData );
	}

		return kinetServer;

	}
};