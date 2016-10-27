#!/usr/bin/env bash

oc project devex-platform-dev

oc process -f devex-environment-template.json -v NAME=devex-dev,APPLICATION_DOMAIN=devex-dev.pathfinder.bcgov,APP_IMAGE_NAMESPACE=devex,APP_DEPLOYMENT_TAG=dev | oc create -f -



oc process -f devex-environment-template.json -v
NAME=devex-dev,
APPLICATION_DOMAIN=devex-dev.pathfinder.bcgov,
APP_IMAGE_NAMESPACE=devex,
APP_DEPLOYMENT_TAG=dev | oc create -f -




"name": "DATABASE_USER",
"name": "DATABASE_PASSWORD",
"name": "DATABASE_NAME",
"name": "DATABASE_ADMIN_PASSWORD",

"name": "DOCUMENT_MOUNT_PATH",
"name": "APP_ADMINPW",
"name": "APP_IMAGE_NAME",

