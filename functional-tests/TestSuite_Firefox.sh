#!/bin/bash

./gradlew firefoxTest --tests="CompanyLoginValidationSpec"
./gradlew firefoxTest --tests="FlowSpecs"
./gradlew firefoxTest --tests="CreateCapability"
./gradlew firefoxTest --tests="CreateProgramProjectOpp"

./gradlew firefoxTest --tests="ProjectValidationSpec"
./gradlew firefoxTest --tests="CreateUsers"
./gradlew firefoxTest --tests="CWU_HappyPath_1"

./gradlew firefoxTest --tests="UserCreatesCompany"
./gradlew firefoxTest --tests="CreateOppSWU"
./gradlew firefoxTest --tests="SWU_HappyPath_1"

./gradlew firefoxTest --tests="UserDeletesProposal_Company"
./gradlew firefoxTest --tests="AdminDeletesSWUOpportunity" 
./gradlew firefoxTest --tests="AdminDeletesCWUOpportunity"
./gradlew firefoxTest --tests="UsersDeleteThemselves"
./gradlew firefoxTest --tests="AdminDeletesCapability"
./gradlew firefoxTest --tests="AdminDeletesProjectProgram"
