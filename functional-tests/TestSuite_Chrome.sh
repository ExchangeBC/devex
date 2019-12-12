#!/bin/bash

./gradlew chromeTest --tests="CompanyLoginValidationSpec"
./gradlew chromeTest --tests="FlowSpecs"
./gradlew chromeTest --tests="CreateCapability"
./gradlew chromeTest --tests="CreateProgramProjectOpp"

./gradlew chromeTest --tests="ProjectValidationSpec"
./gradlew chromeTest --tests="CreateUsers"
./gradlew chromeTest --tests="CWU_HappyPath_1"

./gradlew chromeTest --tests="UserCreatesCompany"
./gradlew chromeTest --tests="CreateOppSWU"
./gradlew chromeTest --tests="SWU_HappyPath_1"

./gradlew chromeTest --tests="UserDeletesProposal_Company"
./gradlew chromeTest --tests="AdminDeletesSWUOpportunity"
./gradlew chromeTest --tests="AdminDeletesCWUOpportunity"
./gradlew chromeTest --tests="UsersDeleteThemselves"
./gradlew chromeTest --tests="AdminDeletesCapability"
./gradlew chromeTest --tests="AdminDeletesProjectProgram"
