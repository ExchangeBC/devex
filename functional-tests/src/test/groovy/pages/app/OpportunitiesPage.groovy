package pages.app
import geb.Page

class OpportunitiesPage extends Page {  
	static at = {title.startsWith("BCDevExchange - The BC Developer") } 

	static url = "opportunities"

	static content = {
		PostAnOpportunity(wait: true) { $("button",href:"/createlanding") }
		TestCWUOpportunities(required: false, wait: 2) { $('div', text: startsWith("CWU Opportunity: ")) }
		TestSWUOpportunities(required: false, wait: 2) { $('div', text: startsWith("SWU Opportunity: ")) }
		EditOppLnk(wait: 2) {$("a",id:"opportunityadmin.edit",0)}
	
		DownloadTerms{$('a[href="/terms/cwu1"]')}
		CWULearnMore{$('data-automation-id':"cwu-LearnMore").click()}
		SWULearnMore{$('data-automation-id':"swu-LearnMore").click()}
		
	}

    void sleepForNSeconds(int n) {
    	def originalMilliseconds = System.currentTimeMillis()
    	waitFor(n + 1, 0.5) { (System.currentTimeMillis() - originalMilliseconds) > (n * 1000) }
	}	
}
