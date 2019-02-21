package pages.app
import geb.Page
//import extensions.AngularJSAware

//class OpportunitiesPage extends Page implements AngularJSAware {
class OpportunitiesPage extends Page {  
	//static at = { angularReady && title == "BCDevExchange - The BC Developer" }
	static at = {title.startsWith("BCDevExchange - The BC Developer") } 

	static url = "opportunities"

	static content = {
				//PostAnOpportunity(wait: true) { $("button", title:"New") }
				PostAnOpportunity(wait: true) { $("button",("class"):"btn btn-primary float-right ng-scope btn-default") }
				FirstListedOpportunity(required: false, wait: 2) {$("div",class:"label-title ng-binding",0)}//This corresponds to a SWU opp
				SecondListedOpportunity(required: false, wait: 2) {$("div",class:"label-title ng-binding",1)}//This corresponds to a CWU opp
				DownloadTerms{$('a[href="/terms/cwu1"]')}
				CWULearnMore{$('data-automation-id':"cwu-LearnMore").click()}
				SWULearnMore{$('data-automation-id':"swu-LearnMore").click()}
		}


    void sleepForNSeconds(int n) {
    	def originalMilliseconds = System.currentTimeMillis()
    	waitFor(n + 1, 0.5) { (System.currentTimeMillis() - originalMilliseconds) > (n * 1000) }
    	}	
}
