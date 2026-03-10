#!/bin/bash
echo "Starting AgriAssist application..."
npm install
npm start > status_log.txt 2>&1
