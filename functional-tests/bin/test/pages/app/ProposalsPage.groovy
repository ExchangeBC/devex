package pages.app
import geb.Page
import extensions.AngularJSAware

class ProposalsPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Proposals List") }
	//static at = { title == "BCDevExchange - Proposals List" }
	static url = "proposals"
	static content = {}
}
