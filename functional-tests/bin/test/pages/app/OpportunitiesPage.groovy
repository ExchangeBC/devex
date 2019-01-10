package pages.app
import geb.Page
//import extensions.AngularJSAware

//class OpportunitiesPage extends Page implements AngularJSAware {
class OpportunitiesPage extends Page {  
	//static at = { angularReady && title == "BCDevExchange - The BC Developer" }
	static at = {title.startsWith("BCDevExchange - The BC Developer") } 

	static url = "opportunities"

	static content = {
				postAnOpportunity(wait: true) { $("button", title:"New").click() }
		}

    void sleepForNSeconds(int n) {
    	def originalMilliseconds = System.currentTimeMillis()
    	waitFor(n + 1, 0.5) { (System.currentTimeMillis() - originalMilliseconds) > (n * 1000) }
    	}	
}
