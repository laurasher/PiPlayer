# install dependencies
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential
sudo apt-get install -y screen

# output versions
node -v
npm -v

# install supervisor, useful for keeping the client running
sudo npm install supervisor -g

# set lighting startup script executable
chmod a+x ~/sudiolights/lighting_client/startup.sh
