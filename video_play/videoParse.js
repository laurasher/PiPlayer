
// print file name
var args = process.argv.slice(2).toString();
console.log(args);

var ffmpeg = require('fluent-ffmpeg');

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