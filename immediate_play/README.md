# PiPlayer
Application for playing movies on assorted lighting hardware with a Raspberry Pi.

## Raspberry Pi Setup From Scratch

### To reimage sd card

diskutil unmountDisk /dev/disk<disk# from diskutil>
sudo dd bs=1m if=Downloads/2015-05-05-raspbian-wheezy.img of=/dev/rdisk<disk# from diskutil>

### Fix keyboard layout
sudo raspi-config
Internationalisation options
Keyboard configuration

### To install node
curl -sLS https://apt.adafruit.com/add | sudo bash
sudo apt-get install node


### Free up some memory
rm -rf python_games

### Clone repo
git clone https://github.com/laurasher/PiPlayer

### Now change network settings
sudo pico /etc/network/interfaces

auto lo
iface lo inet loopback

auto eth0
allow-hotplug eth0
iface eth0 inet dhcp

auto eth0:0
iface eth0:0 inet static
address 10.3.252.100
netmask 255.0.0.0

auto wlan0
allow-hotplug wlan0
iface wlan0 inet manual
wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf

auto wlan1
allow-hotplug wlan1
iface wlan1 inet manual
wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf


### Kill one dhcp client
dpkg -l | grep dhcp
apt-get remove dhcpcd5

### Restart
sudo reboot


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