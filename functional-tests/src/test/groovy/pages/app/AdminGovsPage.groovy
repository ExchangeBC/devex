package pages.app
import geb.Page
import extensions.AngularJSAware

class AdminGovsPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Government List") }
	//static at = { title == "BCDevExchange - Government List" }
	static url = "admin/govs"
	static content = {}
}
