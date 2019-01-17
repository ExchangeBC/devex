package pages.app
import geb.Page

class GitHubPage_ReadGuide extends Page {	
	//The app in localhost and in https://platform-test.pathfinder.gov.bc.ca/codewithus 
	//have different titles but they start with the same words
	static at = {title.startsWith("3.  For Developers: How to Apply on a Code With Us Opportunity") } 
	static url = "https://github.com/BCDevExchange/code-with-us/wiki/3.--For-Developers:-How-to-Apply-on-a-Code-With-Us-Opportunity"     


    static content = {
            //Empty

		}
}
