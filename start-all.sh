#!/bin/bash
echo "installing npm modules..."
npm install
echo "installing global binaries..."
sudo npm install -g express-generator
sudo npm install -g typescript
echo "modules installed."

#echo "making express common files.."
#result=${PWD##*/}
#express -f $result

./install_type.sh
./mongostart.sh
./tscall.sh
echo "starting server..."
npm start
