# BDDStack

## Description

Automated functional test suite for the https://www.bcdevexchange.org/ microprocurement application. 

As for February 2019 the coverage is the following:
	CompanyLoginValidationSpec.groovy
			Validate that unauthenticated users don't have a 'register company' button but authenticated users do.

	FlowSpecs.groovy
			Checks most of the links in the Home Page plus a few more in other pages.

	CreateCapability.groovy
			Administrators creates one capability with three associated skills

	CreateProgramProjectOpp.groovy
			The test will simulate an Administrator creating, in this order, a Program, a Project and one CWU Opportunity.

	ProjectValidationSpec.groovy
			Check the administrator can not create projects with Invalid names
	
	CreateUsers.groovy
			Three users (already existing in GitHub) register themselves into the BCDevExchange system

	CWU_HappyPath_1.groovy
			One user creates and submit a CWU proposal	

	UserCreatesCompany.groovy
			One user creates a company. Two different users request to be added to the company. Company creator accepts one request and rejects the second.

	CreateOppSWU.groovy
			Administrator creates a SWU opportunity

	SWU_HappyPath_1.groovy
			One user with a company creates and submits a SWU proposal

	UserDeletesProposal_Company.groovy
			User deletes the previously created CWU and SWU proposals and the previously created company
	
	AdminDeletesOpportunity.groovy
			Administrator deletes the existing CWU and SWU opportunities
	
	UsersDeleteThemselves.groovy
			Users log in the system and delete their profiles.

	AdminDeletesCapability.groovy
			Admin deletes a capability
	
	AdminDeletesProjectProgram.groovy
			Admin deletes an existing project and the existing program



## Usage
To run the test suite, open terminal and navigate to the .../devex/functional-test directory and execute
	./TestSuite.sh

This script will run the groovy scripts in the appropriate order: some of the test are preconditions for the following test. For example, before a user can submit a proposal, the proposal is required to exist.

Opening TestSuite.sh you wIll learn the order in which the scripts are run. To run any of them individually, you can execute the following command

	./gradlew chromeTest --tests="NameOfTtheSpecificationToRun"

for example

	./gradlew chromeTest --tests="CreateUsers"

For this suite, each groovy script contains only one specification, and the name of the specification is the same as the groovy script.

The previous command will run the test using Chrome. Currently the system is only configured to run on Chrome, chromeHeadless, Firefox and firefoxHeadless. The file that controls it is

	⁨.../devex⁩/functional-tests⁩/src⁩/test⁩/resources/GebConfig.groovy

However, this suite is fully tested using Chrome, but I have run into problems using the other options. In the case of Firefox there is a couple bugs in the code that prevents to proceed (bugs that do not show up in Chrome). Another problem i have found is that chromeHeadless can't download files (the reported bug can be checked at https://stackoverflow.com/questions/50905846/how-to-enable-download-file-in-headless-chrome-in-the-latest-chrome-driver-ver. You can also read the discussions  in https://github.com/TheBrainFamily/chimpy/issues/108 and https://stackoverflow.com/questions/50905846/how-to-enable-download-file-in-headless-chrome-in-the-latest-chrome-driver-ver)

Do not be tempted to run all the test with the following command

    ./gradlew Test

the reason is the tests need to be run in order, so any alteration of the order will generated errors.


## Questions and issues

Please ask questions on our [Slack Channel][slack_channel] and raise issues in [BDDStack issue tracker][issue_tracker].


##Pitfalls and weirdness

- When creating locators this is ok
	HowToApply{$("a",id:"sprintwithus-howtoapply")}

Notice id is not surrounded by quotes. However, more complex labels need to be surrounded by quotes, like
	SaveChangesButton { $("button", 'data-automation-id': "btnSaveChangesSkills")}


- XPath locators are by definition brittle. There are a few ones in the code, as other locators that I tried didn’t work. The text boxes where the user can format their text are all located with XPath locators.
These components are <Iframes> element nested inside several <div> element. If all the block (all the <div>) is moved  to another section of the page as unit, I think that the automation will continue working with no trouble


- Sprinkled through the code there are a lot of Sleep() delays. In most of the cases it does not make any sense, as WaitFor{} function should be enough, but without them the test breaks!. If you find a more elegant way to avoid them please share!


- A couple times I have noticed that checking the APIs link (to http://apilist.pathfinder.gov.bc.ca/) the test fails. The problem seems to not be on the code or the test, the problem is that sometimes the target server takes a long time to reply


- The first time I run the test in Firefox it was an utter chaos: the system was spinning Firefox browser instances by the dozen collapsing the machine resources. The problem was that I was using the latest and greatest version of Firefox (65.0.1) but not the latest version of Gecko (0.24.0). Once synchronized all was fine. 
Gecko version is set in build.gradle, you do not need to install Gecko on your box, Gradle download it for you, but still need to indicate the version of Gecko you want to use.




## Useful Links:

<http://www.gebish.org/manual/current>

<http://spockframework.org/>

<http://groovy-lang.org/>

<https://inviqa.com/blog/bdd-guide>

<https://github.com/SeleniumHQ/selenium/wiki>


[navunit]: https://github.com/bcgov/navUnit
[dockerfile]: https://github.com/BCDevOps/openshift-tools/blob/master/provisioning/jenkins-slaves/bddstack/Dockerfile
[issue_tracker]: https://github.com/rstens/BDDStack/issues
[slack_channel]: https://devopspathfinder.slack.com/messages/C7J72K1MG
