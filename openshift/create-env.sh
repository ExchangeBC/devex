#!/usr/bin/env bash

echo -n "Enter the name of the team: "
read TEAM
echo -n "Enter the short name of the product: "
read PRODUCT
echo -n "Enter the display name of the product: "
read PRODUCT_DISPLAY
echo -n "Enter the description name of the product: "
read PRODUCT_DESCRIPTION
echo -n "Enter the category of the product: "
read CATEGORY
echo -n "Enter the name of the environment: "
read ENVIRONMENT

OS_PROJECT_NAME=$TEAM-$PRODUCT-$ENVIRONMENT

echo "Creating new Project called $OS_PROJECT_NAME..."

oc new-project $OS_PROJECT_NAME --display-name='$PRODUCT_DISPLAY' --description='$PRODUCT_DESCRIPTION'

echo -n "Enter the path to the environment creation template: "
read CREATE_SCRIPT

oc create -f $CREATE_SCRIPT

/bin/bash project_label.sh $OS_PROJECT_NAME category=$CATEGORY team=$TEAM product=$PRODUCT environment=$ENVIRONMENT
