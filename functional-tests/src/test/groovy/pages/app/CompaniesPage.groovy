package pages.app
import geb.Page
//import extensions.AngularJSAware

//class CompaniesPage extends Page implements AngularJSAware {
class CompaniesPage extends Page {
	//static at = { angularReady && title.startsWith("BCDevExchange - Orgs List") }
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "orgs"

	static content = {
    	RegisterCompanyButton { $("button",'data-automation-id':"button-register-a-company") }


  }
}
