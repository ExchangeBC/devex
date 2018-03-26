#!/bin/bash

sonar-scanner \
  -Dsonar.projectKey=devex-local-1 \
  -Dsonar.sources=./modules \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=63ea3e02e8876721627d0d6afc553f98af221932
