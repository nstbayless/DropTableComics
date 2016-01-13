#!/bin/bash
#starts mongodb daemon
echo "starting mongod on port 27018..."
mkdir data
mongod --port 27018 --dbpath ./data
