#!/bin/bash

./gradlew firefoxHeadlessTest --tests="CompanyLoginValidationSpec"
./gradlew firefoxHeadlessTest --tests="FlowSpecs"
./gradlew firefoxHeadlessTest --tests="CreateCapability"
./gradlew firefoxHeadlessTest --tests="CreateProgramProjectOpp"

./gradlew firefoxHeadlessTest --tests="ProjectValidationSpec"
./gradlew firefoxHeadlessTest --tests="CreateUsers"
./gradlew firefoxHeadlessTest --tests="CWU_HappyPath_1"

./gradlew firefoxHeadlessTest --tests="UserCreatesCompany"
./gradlew firefoxHeadlessTest --tests="CreateOppSWU"
./gradlew firefoxHeadlessTest --tests="SWU_HappyPath_1"

./gradlew firefoxHeadlessTest --tests="UserDeletesProposal_Company"
./gradlew firefoxHeadlessTest --tests="AdminDeletesSWUOpportunity" 
./gradlew firefoxHeadlessTest --tests="AdminDeletesCWUOpportunity"
./gradlew firefoxHeadlessTest --tests="UsersDeleteThemselves"
./gradlew firefoxHeadlessTest --tests="AdminDeletesCapability"
./gradlew firefoxHeadlessTest --tests="AdminDeletesProjectProgram"
