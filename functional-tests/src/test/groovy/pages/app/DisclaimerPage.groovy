package pages.app
import geb.Page
//import extensions.AngularJSAware

//class DisclaimerPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - Disclaimer") }
class DisclaimerPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	//static at = { title == "BCDevExchange - Disclaimer" }
	static url = "disclaimer"
	static content = {}
}
