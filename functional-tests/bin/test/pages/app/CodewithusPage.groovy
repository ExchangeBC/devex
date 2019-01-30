package pages.app
import geb.Page
//import extensions.AngularJSAware

//class CodewithusPage extends Page implements AngularJSAware {
class CodewithusPage extends Page {	
	//The app in localhost and in https://platform-test.pathfinder.gov.bc.ca/codewithus 
	//have different titles but they start with the same words
	static at = {title.startsWith("BCDevExchange - The BC Developer") } 
	//static at = { title == "BCDevExchange - Code With Us" }
	static url = "codewithus"

    static content = {
        DevelopersButton { $('a[id ~= "codewithus"]',0)}
		DevelopersButtonClass{ $('a[id ~= "codewithus"]',0).@class}
		PublicSectorProductManagers{ $('a[id ~= "codewithusps"]',0).@class}
		BrowseOpportunitiesLink{$('a[class~="btn-primary"]').click()}

		ReadtheGuideLink{$('a[class="btn btn-lg btn-text-only"]').click()}
//class~="btn btn-lg btn-text-only",
		}
}
