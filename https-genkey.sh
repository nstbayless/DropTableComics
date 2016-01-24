#!/bin/bash
mkdir ssl
cd ssl
openssl req -nodes -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 91
openssl rsa -in key.pem -out newkey.pem && mv newkey.pem key.pem
