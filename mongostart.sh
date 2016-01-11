#!/bin/bash
echo "starting mongod on port 27018..."
mkdir data
mongod --port 27018 --dbpath ./data
