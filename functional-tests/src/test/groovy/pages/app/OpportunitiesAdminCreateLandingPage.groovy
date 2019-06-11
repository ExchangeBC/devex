package pages.app
import geb.Page

class OpportunitiesAdminCreateLandingPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer") } 
	static url = "opportunityadmin/createlanding"
	static content = {
    	createCWUOpportunityButton(wait: true) { $(('button[data-automation-id ~= "button-create-codewithus"]'), 0) }
    	createSWUOpportunityButton(wait: true) { $(('button[data-automation-id ~= "button-create-sprintwithus"]'), 0) }
	}
}
