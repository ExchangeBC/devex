#!/usr/bin/env bash

#project_label.sh $OS_PROJECT_NAME category=$CATEGORY team=$TEAM product=$PRODUCT environment=$ENVIRONMENT

PROJECT_NAME=$1

echo "Project name is $1"

for i in "${@:2}"; do
    oc label namespace/$PROJECT_NAME $i
done
