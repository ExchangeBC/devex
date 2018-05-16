package pages.app
import geb.Page
import extensions.AngularJSAware

class CompaniesPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Orgs List") }
	//static at = { title == "BCDevExchange - Projects List" }
	static url = "orgs"
	static content = {
      RegisterCompanyButton { $('button[data-automation-id ~= "button-register-a-company"]') }
  }
}
