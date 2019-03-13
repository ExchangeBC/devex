package pages.app
import geb.Page
//import geb.module.*
//import org.openqa.selenium.By
//import org.openqa.selenium.Keys
//import geb.Browser
//import extensions.AngularJSAware
//import modules.CheckboxModule

//lass OpportunitiesAdminCreateLandingPage extends Page implements AngularJSAware {
//	static at = { angularReady && title == "BCDevExchange - New Opportunity" }
class OpportunitiesAdminCreateLandingPage extends Page {
	static at = {title.startsWith("BCDevExchange - The BC Developer") } 
	static url = "opportunityadmin/createlanding"
	static content = {
    	createCWUOpportunityButton{ $(('button[data-automation-id ~= "button-create-codewithus"]'), 0) }
    	createSWUOpportunityButton{ $(('button[data-automation-id ~= "button-create-sprintwithus"]'), 0) }
	}
}
