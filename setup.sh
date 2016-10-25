#!/bin/bash

docker run -p 27017:27017 -d --name db_devex mongo
docker build -t mean/devex .
