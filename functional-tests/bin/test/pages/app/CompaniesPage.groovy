package pages.app
import geb.Page
import org.openqa.selenium.By

//import extensions.AngularJSAware

//class CompaniesPage extends Page implements AngularJSAware {
class CompaniesPage extends Page {
	//static at = { angularReady && title.startsWith("BCDevExchange - Orgs List") }
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "orgs"

	static content = {
    	RegisterCompanyButton { $("button",'data-automation-id':"button-register-a-company") }
		NewCompany{$("td",'data-automation-id':"holderCompanyName")} //first element of the table
		JoinCompanyButton{$("button",'data-automation-id':"btnJoinCompany") }
		YesButton { $("button",'data-automation-id':"button-modal-yes") }
		PendingLbl{$("label",'data-automation-id':"lblPending")}
  }
}

