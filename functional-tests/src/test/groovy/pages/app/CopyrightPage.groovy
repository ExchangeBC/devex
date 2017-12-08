package pages.app
import geb.Page
import extensions.AngularJSAware

class CopyrightPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Copyright") }
	//static at = { title == "BCDevExchange - Copyright" }
	static url = "copyright"
	static content = {}
}
