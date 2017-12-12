package pages.app
import geb.Page
import extensions.AngularJSAware

class OpportunitiesPage extends Page implements AngularJSAware {
    
	static at = { angularReady && title == "BCDevExchange - Opportunities List" }
	static url = "opportunities"

	static content = {
				postAnOpportunity(wait: true) { $("button", title:"New").click() }
		}

    void sleepForNSeconds(int n) {
    	def originalMilliseconds = System.currentTimeMillis()
    	waitFor(n + 1, 0.5) { (System.currentTimeMillis() - originalMilliseconds) > (n * 1000) }
    	}	
}
