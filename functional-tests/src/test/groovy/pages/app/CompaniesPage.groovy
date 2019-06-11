package pages.app
import geb.Page
import org.openqa.selenium.By

class CompaniesPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "orgs"
	static content = {
    	RegisterCompanyButton(wait: true) { $("button",'data-automation-id':"button-register-a-company") }
		NewCompany(wait: true) { $("td",'data-automation-id':"holderCompanyName").last() }
		JoinCompanyButton(wait: true) { $("button",'data-automation-id':"btnJoinCompany").last() }
		YesButton(wait: true) { $("button",'data-automation-id':"button-modal-yes") }
		PendingLbl(wait: true) { $("label",'data-automation-id':"lblPending").last() }
		NextPageLink(wait: true) { $("a", text: "Next") }
  }
}
