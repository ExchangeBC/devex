package pages.app
import geb.Page
import extensions.AngularJSAware

class CodewithusPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Code With Us") }
	//static at = { title == "BCDevExchange - Code With Us" }
	static url = "codewithus"
	static content = {}
}
