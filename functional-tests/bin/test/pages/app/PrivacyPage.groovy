package pages.app
import geb.Page
//import extensions.AngularJSAware

//class PrivacyPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - Privacy") }
class PrivacyPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "privacy"
	static content = {}
}
