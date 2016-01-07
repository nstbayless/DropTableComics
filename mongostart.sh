#!/bin/bash
echo "starting mongod on port 27018..."
cd data
mongod --port 27018 --dbpath
