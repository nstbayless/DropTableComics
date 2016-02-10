#!/bin/bash
#starts server
echo "starting mongodb in the background... switch to a new terminal if output is nauseating"
./mongostart.sh&
./tscall.sh
echo "starting server... if any errors occur, check for errors above"
npm start
