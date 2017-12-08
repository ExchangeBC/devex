package pages.app
import geb.Page
import extensions.AngularJSAware

class DisclaimerPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Disclaimer") }
	//static at = { title == "BCDevExchange - Disclaimer" }
	static url = "disclaimer"
	static content = {}
}
