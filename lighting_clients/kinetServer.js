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

		var header = [   0x04,  0x01,  0xDC,  0x4A, //magic number
   	0x01,  0x00, //kinet version
   	0x01,  0x01, //packet type
   	0x00,  0x00,  0x00,  0x00,
    0x00, //port
    0x00, //flags, not used
    0x00,   0x00, //timerval, not used
    0x00,   0x00 //universe
    // 0x00,   0x00, //universe
    // 0x00 //DMX start code
    ];

		return header;

		}


		kinetServer.sendKinetData = function( iPixelData, ipAddress, iKinetPort ){

			// If pixel data is too long, clip array
			if ( iPixelData.length > 150 ){

				console.log("Warning: Pixel data array is too long.  Clipping to 150 pixel values.");
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