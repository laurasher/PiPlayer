#!/usr/bin/bash
# Start my node project
# gnome-terminal --tab -e "bash -c 'cd ~/PiPlayer/server && node server.js'" --tab -e "bash -c 'cd ~/PiPlayer/immediate_play && node immediate_play.js'"
# cd ~/PiPlayer/server && node server.js
# cd ~/PiPlayer/immediate_play && node immediate_play.js


tmux -L list-session
tmux send-keys 'cd ~/PiPlayer/server' 'enter'
tmux send-keys 'node server.js'
tmux
tmux send-keys 'cd ~/PiPlayer/immediate_play' 'enter'
tmux send-keys 'node immediate_play.js'
