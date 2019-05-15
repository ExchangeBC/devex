#!/bin/bash

./gradlew chromeHeadlessTest --tests="CompanyLoginValidationSpec"
./gradlew chromeHeadlessTest --tests="FlowSpecs"
./gradlew chromeHeadlessTest --tests="CreateCapability"
./gradlew chromeHeadlessTest --tests="CreateProgramProjectOpp"

./gradlew chromeHeadlessTest --tests="ProjectValidationSpec"
./gradlew chromeHeadlessTest --tests="CreateUsers"
./gradlew chromeHeadlessTest --tests="CWU_HappyPath_1"

./gradlew chromeHeadlessTest --tests="UserCreatesCompany"
./gradlew chromeHeadlessTest --tests="CreateOppSWU"
./gradlew chromeHeadlessTest --tests="SWU_HappyPath_1"

./gradlew chromeHeadlessTest --tests="UserDeletesProposal_Company"
./gradlew chromeHeadlessTest --tests="AdminDeletesSWUOpportunity" 
./gradlew chromeHeadlessTest --tests="AdminDeletesCWUOpportunity"
./gradlew chromeHeadlessTest --tests="UsersDeleteThemselves"
./gradlew chromeHeadlessTest --tests="AdminDeletesCapability"
./gradlew chromeHeadlessTest --tests="AdminDeletesProjectProgram"
