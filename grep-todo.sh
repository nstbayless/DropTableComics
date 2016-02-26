#!/bin/bash
echo "TODOs found:"
grep -n -B1 -A2 "//TODO" *.ts
grep -n -B1 -A2 "//TODO" */*.ts
grep -n -B1 -A2 "//TODO" ./public/javascripts/*
grep -n -B1 -A2 "// TODO" *.ts
grep -n -B1 -A2 "// TODO" */*.ts
grep -n -B1 -A2 "// TODO" ./public/javascripts/*
