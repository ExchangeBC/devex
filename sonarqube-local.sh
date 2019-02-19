#!/bin/bash
cd sonar-runner
./gradlew sonarqube --stacktrace --info \
    -Dsonar.verbose=true \
    -Dsonar.host.url='https://sonarqube-devex-platform-tools.pathfinder.gov.bc.ca' \
    -Dsonar.projectName='Devex.Dev' \
    -Dsonar.projectKey='org.sonarqube:bcgov-devex-dev' \
    -Dsonar.projectBaseDir='../' \
    -Dsonar.sources='./'