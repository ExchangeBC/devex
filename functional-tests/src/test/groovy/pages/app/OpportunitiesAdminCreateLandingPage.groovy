package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import geb.Browser
import extensions.AngularJSAware
import modules.CheckboxModule

class OpportunitiesAdminCreateLandingPage extends Page implements AngularJSAware {
	static at = { angularReady && title == "BCDevExchange - New Opportunity" }
	static url = "opportunityadmin/createlanding"
	static content = {
    	createCWUOpportunityClick{ $(('button[data-automation-id ~= "button-create-codewithus"]'), 0).click() }
    	createSWUOpportunityClick{ $(('button[data-automation-id ~= "button-create-sprintwithus"]'), 0).click() }
}
}
