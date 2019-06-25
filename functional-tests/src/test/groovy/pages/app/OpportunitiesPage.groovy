package pages.app
import geb.Page
import modules.LoginModule

class OpportunitiesPage extends Page {  
	static at = {title.startsWith("BCDevExchange - The BC Developer") } 

	static url = "opportunities"

	static content = {
		login { module LoginModule }
		SigninLink(wait: true) { $("a", id: "authentication.signin") }
		PostAnOpportunity(wait: true) { $("button",href:"/createlanding") }
		TestCWUOpportunities(required: false, wait: true) { $('div', text: startsWith("CWU Opportunity: ")) }
		TestSWUOpportunities(required: false, wait: true) { $('div', text: startsWith("SWU Opportunity: ")) }
		EditOppLnk(wait: true) { $("a",id:"opportunityadmin.edit",0) }
		DownloadTerms(wait: true) { $('a[href="/terms/cwu1"]') }
		CWULearnMore(wait: true) { $('data-automation-id':"cwu-LearnMore") }
		SWULearnMore(wait: true) { $('data-automation-id':"swu-LearnMore") }
		PublishButton(wait: true) { $('data-automation-id': "button-opportunity-publish") }
		ModalConfirmButton(wait: true) { $("button", 'data-automation-id': "button-modal-yes") }
	}
}
