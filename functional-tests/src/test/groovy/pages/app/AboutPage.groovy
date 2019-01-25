package pages.app
import geb.Page
//import extensions.AngularJSAware

//class AboutPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - About Us") }
class AboutPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "about"
	static content = {}
}
