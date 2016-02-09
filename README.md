# PiPlayer
Application for playing movies on assorted lighting hardware.

Pi 2.0 IP 192.168.0.44
ssh pi@192.168.0.44

brew update

brew install ffmpeg --with-fdk-aac --with-ffplay --with-freetype --with-frei0r --with-libass --with-libvo-aacenc --with-libvorbis --with-libvpx --with-opencore-amr --with-openjpeg --with-opus --with-rtmpdump --with-schroedinger --with-speex --with-theora --with-tools

npm install ffmpeg

node videoParse.js 'ProcessTest.avi'
