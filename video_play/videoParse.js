console.log("Video parse:");

// print file name
var args = process.argv.slice(2).toString();
console.log(args);

// ffmpeg -i ./test.3gp
// -acodec libfaac -ab 128k -ar 41000
// -vcodec libx264 -vpre slow -vpre baseline -s 640x360 -r 25
// ./test.mp4

var ffmpeg = require('ffmpeg');

try {
    new ffmpeg( args, function (err, video) {
        if (!err) {
            console.log('The video is ready to be processed');
        } else {
            console.log('Error: ' + err);
        }
    });
} catch (e) {
    console.log(e.code);
    console.log(e.msg);
}