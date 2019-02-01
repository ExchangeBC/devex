#!/bin/bash
./gradlew chromeTest --tests="CompanyLoginValidationSpec"
./gradlew chromeTest --tests="FlowSpecs"
./gradlew chromeTest --tests="CreateCapability"
./gradlew chromeTest --tests="CreateProgramProjectOpp"
./gradlew chromeTest --tests="CreateOppSWU"
./gradlew chromeTest --tests="ProjectValidationSpec"
./gradlew chromeTest --tests="CreateUsers"
./gradlew chromeTest --tests="UserCreatesCompany"

./gradlew chromeTest --tests="CWU_HappyPath_1"
