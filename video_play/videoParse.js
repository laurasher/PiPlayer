
var ffmpeg = require('ffmpeg');

var args = process.argv.slice(2).toString();
// console.log(args);


try {
    new ffmpeg( args, function (err, video) {
        if (!err) {
						// console.log(video.metadata);
            console.log('The video is ready to be processed');
				video.fnExtractFrameToJPG('/Users/lasher/Sosolimited/PiPlayer/video_play/exported', {
							start_time              : null      // Start time to recording
  					, duration_time           : null      // Duration of recording
  					, frame_rate              : null      // Number of the frames to capture in one second
  					, size                    : null      // Dimension each frame
  					, number                  : 10      // Total frame to capture
  					, every_n_frames          : 1      // Frame to capture every N frames
  					, keep_pixel_aspect_ratio : true      // Mantain the original pixel video aspect ratio
  					, keep_aspect_ratio       : true      // Mantain the original aspect ratio
  					, padding_color           : 'black'   // Padding color
  					, file_name               : 'export_frame_%t'      // File name
	        }, function (error, files) {
	            if (!error)
	                console.log('Frames: ' + files);
	        });
        } else {
            console.log('Error: ' + err);
        }
    });
} catch (e) {
    console.log(e.code);
    console.log(e.msg);
}


// extract to jpeg using ffmepg
/*
try {
    var process = new ffmpeg( '/Users/lasher/Sosolimited/PiPlayer/video_play/ProcessTest.avi' );
    process.then(function (video) {
        // Callback mode
        video.fnExtractFrameToJPG('/Users/lasher/Sosolimited/PiPlayer/video_play', {
            frame_rate : 1,
            number : 1,
            file_name : 'one_frame'
        }, function (error, files) {
            if (!error)
                console.log('Frames: ' + files);
        });
    }, function (err) {
        console.log('Error: ' + err);
    });
} catch (e) {
    console.log(e.code);
    console.log(e.msg);
}

*/

// get pixel data from jpeg using (maybe) gm

// send pixel data to power supply using kinetServer