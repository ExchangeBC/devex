package pages.app
import geb.Page
//import extensions.AngularJSAware

//class ProposalsPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
class ProposalsPage extends Page  {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	//static at = { title == "BCDevExchange - Proposals List" }
	static url = "proposals"
	static content = {}
}
