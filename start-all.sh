#!/bin/bash
#installs everything and starts server
echo "installing npm modules..."
npm install
echo "installing global binaries... (you can skip this if you've already done this)"
echo "npm install -g express-generator"
sudo npm install -g express-generator
echo "sudo npm install -g typescript"
sudo npm install -g typescript
echo "modules installed."

./install_type.sh
echo "starting mongodb in the background... switch to a new terminal if output is nauseating"
./mongostart.sh&
./tscall.sh
echo "starting server... if any errors occur, check for errors above"
npm start
