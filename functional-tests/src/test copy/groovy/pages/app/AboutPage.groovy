package pages.app
import geb.Page
import extensions.AngularJSAware


class AboutPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - About Us") }
	//static at = { title == "BCDevExchange - About Us" }
	static url = "about"
	static content = {}
}
