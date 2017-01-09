#!/usr/bin/env bash

oc project devex-platform-dev

oc process -f devex-environment-template.json -v NAME=devxp-dev,APPLICATION_DOMAIN=devxp-dev.pathfinder.bcgov,APP_IMAGE_NAMESPACE=devex-platform-tools,APP_DEPLOYMENT_TAG=dev | oc create -f -

oc process -f devex-environment-template.json -v NAME=devxp-test,APPLICATION_DOMAIN=devxp-test.pathfinder.bcgov,APP_IMAGE_NAMESPACE=devex-platform-tools,APP_DEPLOYMENT_TAG=test | oc create -f -

oc process -f devex-environment-template.json -v NAME=devxp-prod,APPLICATION_DOMAIN=devxp-prod.pathfinder.bcgov,APP_IMAGE_NAMESPACE=devex-platform-tools,APP_DEPLOYMENT_TAG=prod | oc create -f -



oc process -f devex-environment-template.json -v
NAME=devxp-dev,
APPLICATION_DOMAIN=devxp-dev.pathfinder.bcgov,
APP_IMAGE_NAMESPACE=devex-platform-tools,
APP_DEPLOYMENT_TAG=dev | oc create -f -




"name": "DATABASE_USER",
"name": "DATABASE_PASSWORD",
"name": "DATABASE_NAME",
"name": "DATABASE_ADMIN_PASSWORD",

"name": "DOCUMENT_MOUNT_PATH",
"name": "APP_ADMINPW",
"name": "APP_IMAGE_NAME",

