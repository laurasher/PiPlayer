# PiPlayer
Application for playing movies on assorted lighting hardware with a Raspberry Pi.

OLD

brew update

brew install ffmpeg --with-fdk-aac --with-ffplay --with-freetype --with-frei0r --with-libass --with-libvo-aacenc --with-libvorbis --with-libvpx --with-opencore-amr --with-openjpeg --with-opus --with-rtmpdump --with-schroedinger --with-speex --with-theora --with-tools

npm install ffmpeg

node videoParse.js 'ProcessTest.avi'


----------------------------------------------------------

## For Immediate Play Version

### To configure the node software:

1. `cd ~/immediate_play/`
2. `npm install`
3. `cp config-default.js config.js`
4. Edit the config as necessary: `pico config.js`
5. Run the software: `node lightingClient.js`


### Launch the Node.js software as a background process on Raspberry Pi boot

We want to set the node.js script to run at startup for convenience. Open the pi startup script: `pico /etc/rc.local` and add a line right before "exit 0" at the bottom: `su - pi -c "screen -dm -S pistartup sh ~/PiPlayer/startup.sh"`. This will launch the script in the "screen" process, which is a terminal process manager. You can "resume" a running screen command by typing `screen -r`, which will come in handy if you have to connect to the Pi to kill the node process when updating the git repo.