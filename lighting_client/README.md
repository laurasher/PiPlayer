# Installing Lighting Hardware Client to Raspberry Pi

## 1. Install software Prereqs

This guide assumes you have a fresh copy of Rasbian installed to the pi, and you have hooked up a monitor and keyboard. For the intial setup, connect the Pi to ethernet with internet access (it will grab an IP automatically).

1. confirm you are connected to the internet: `ping google.com` (Ctrl+C to quit)
2. pull down the sudiolights repo into your home directory: `git clone git@github.com:sosolimited/sudiolights.git`
3. `cd sudiolights`
4. Run our bootstrap script to install some needed software prereqs: `sh vagrant/boostrap.sh`

## 2. Set up Linux networking

Now that we have the software installed, we need to configure Rasbian linux networking to fit our scenario. We found the best physical configuration is to have the Pi's built in ethernet port connected to the internet/local Soso LAN, and attach a USB ethernet dongle to the Pi for its connection to the lighting hardware (we couldn't get the WiFi dongle to behave while the regular ethernet port was in use).

Once you have this setup, confirm both ethernet interfaces are visible to linux: `ifconfig` should show `eth0` and `eth1` interfaces. `eth0` should have an IP, and eth1 shouldn't.

Run `sudo pico /etc/network/interfaces` and paste in the following:

```
auto lo
iface lo inet loopback

allow-hotplug eth0
iface eth0 inet dhcp

allow-hotplug eth1
iface eth1 inet static
    address 10.3.252.200
    netmask 255.255.255.0

iface default inet dhcp

```

The `address` for eth1 should belong to the same subnet as the lighting hardware's static IP, and of course should be different than that static IP.

Connect to the pi's USB ethernet dongle to the lighting hardware and reboot the pi: `sudo reboot`

Once you're booted up, confirm you can reach the lighting hardware's IP (for example, Boston's lighting hardware IP): `ping 10.3.252.1`

Cool, we have the basic networking hardare setup working.

## 3. Test out the node.js software

Now to configure the node software:

1. `cd ~/sudiolights/lighting_client/`
2. `npm install`
3. `cp config-default.js config.js`
4. Edit the config as necessary: `pico config.js`
5. Run the software: `node lightingClient.js`

You should see a message like "connected to frame server". Test it out by hitting up http://lightpost.sosolimited.com.

## 4. Launch the Node.js software as a background process on Raspberry Pi boot

Finally, we want to set the node.js script to run at startup for convenience. Open the pi startup script: `pico /etc/rc.local` and add a line right before "exit 0" at the bottom: `su - pi -c "screen -dm -S pistartup sh ~/sudiolights/lighting_client/startup.sh"`. This will launch the script in the "screen" process, which is a terminal process manager. You can "resume" a running screen command by typing `screen -r`, which will come in handy if you have to connect to the Pi to kill the node process when updating the git repo.

After editing rc.local, restart the pi, and after a few minutes confirm everything is working by using the lightpost website.

## Installing on an older Pi

Download the [NOOBS](https://www.raspberrypi.org/downloads/) version of raspbian. Follow the [instructions](https://www.raspberrypi.org/help/noobs-setup/) to get it running.

1. clone the repo, the same steps as step one above.
2. `wget http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz`
3. `cd /usr/local && sudo tar --strip-components 1 -xzf /home/pi/node-v0.10.28-linux-arm-pi.tar.gz`
4. Make sure Node is playing nice by typing `node -v`  You should see the `v0.10.28`.
5. `sudo apt-get install -y build-essential`
6. `sudo apt-get install -y screen`
7. `sudo npm install supervisor -g`
8. `chmod a+x ~/sudiolights/lighting_client/startup.sh`

### Single Network Interface

1. Plug your Raspberry Pi and Kinet into the router or office switch.
2. On the Pi update the **/etc/network/interfaces** to match below.
	1. `sudo pico /etc/network/interfaces`
	2. Add or Update to match:
		```
		auto eth0
		allow-hotplug eth0
		iface eth0 inet dhcp

		auto eth0:0
		iface eth0:0 inet static
		address 10.3.252.100
		netmask 255.0.0.0
		```
	3. `sudo /etc/init.d/networking restart`
3. Type `ifconfig` and it should have the 2 following.
```
eth0      Link encap:Ethernet  HWaddr b8:27:eb:73:ac:76
          inet addr:192.168.0.47  Bcast:192.168.0.255  Mask:255.255.255.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:80608 errors:0 dropped:4 overruns:0 frame:0
          TX packets:22213 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:46627068 (44.4 MiB)  TX bytes:2804570 (2.6 MiB)

eth0:0    Link encap:Ethernet  HWaddr b8:27:eb:73:ac:76
          inet addr:10.3.252.100  Bcast:10.255.255.255  Mask:255.0.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
```

Finish with steps 3 & 4 above for testing and automatically launching the app in the background.