#!/bin/bash
echo "installing npm modules..."
npm install
echo "modules installed."
./install_type.sh
./mongostart.sh
./tscall.sh
echo "starting server..."
npm start
