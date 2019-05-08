package pages.app
import geb.Page

class OpportunitiesPage extends Page {  
	static at = {title.startsWith("BCDevExchange - The BC Developer") } 

	static url = "opportunities"

	static content = {
		PostAnOpportunity(wait: true) { $("button",href:"/createlanding") }
		TestCWUOpportunity(wait: true) { $('div', text: startsWith("CWU Opportunity: "), 0) }
		// FirstListedOpportunity(required: false, wait: 2) {$("div",class:"label-title ng-binding",0)} //This corresponds to a SWU opp
		// SecondListedOpportunity(required: false, wait: 2) {$("div",class:"label-title ng-binding",1)} //This corresponds to a CWU opp
	
		DownloadTerms{$('a[href="/terms/cwu1"]')}
		CWULearnMore{$('data-automation-id':"cwu-LearnMore").click()}
		SWULearnMore{$('data-automation-id':"swu-LearnMore").click()}
		EditOppLnk{$("a",id:"opportunityadmin.edit",0)}
	}

    void sleepForNSeconds(int n) {
    	def originalMilliseconds = System.currentTimeMillis()
    	waitFor(n + 1, 0.5) { (System.currentTimeMillis() - originalMilliseconds) > (n * 1000) }
	}	
}
