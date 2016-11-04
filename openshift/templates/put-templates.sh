#!/usr/bin/env bash

oc project devex-platform-dev

oc process -f devex-environment-template.json -v NAME=devex-dev,APPLICATION_DOMAIN=devex-dev.pathfinder.bcgov,APP_IMAGE_NAMESPACE=devex-platform-tools,APP_DEPLOYMENT_TAG=dev | oc create -f -

oc process -f devex-environment-template.json -v NAME=devex-test,APPLICATION_DOMAIN=devex-test.pathfinder.bcgov,APP_IMAGE_NAMESPACE=devex-platform-tools,APP_DEPLOYMENT_TAG=test | oc create -f -

oc process -f devex-environment-template.json -v NAME=devex-prod,APPLICATION_DOMAIN=devex-prod.pathfinder.bcgov,APP_IMAGE_NAMESPACE=devex-platform-tools,APP_DEPLOYMENT_TAG=prod | oc create -f -



oc process -f devex-environment-template.json -v
NAME=devex-dev,
APPLICATION_DOMAIN=devex-dev.pathfinder.bcgov,
APP_IMAGE_NAMESPACE=devex-platform-tools,
APP_DEPLOYMENT_TAG=dev | oc create -f -




"name": "DATABASE_USER",
"name": "DATABASE_PASSWORD",
"name": "DATABASE_NAME",
"name": "DATABASE_ADMIN_PASSWORD",

"name": "DOCUMENT_MOUNT_PATH",
"name": "APP_ADMINPW",
"name": "APP_IMAGE_NAME",

