package pages.app
import geb.Page
//import extensions.AngularJSAware

//class CopyrightPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - Copyright") }
class CopyrightPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "copyright"
	static content = {}
}
