package pages.app
import geb.Page
import extensions.AngularJSAware

class PrivacyPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Privacy") }
	//static at = { title == "BCDevExchange - Privacy" }
	static url = "privacy"
	static content = {}
}
