package pages.app

import geb.Page
import extensions.AngularJSAware

class OpportunityDetailPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Opportunity:") }
    
    static content = {
    	unPublished { $("label.label-danger")[0].contains("UNPUBLISHED") }
    	oppDetailTitle { $("h2").text() }
    }
}
