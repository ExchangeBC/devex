package pages.app
import geb.Page
import extensions.AngularJSAware

class SprintwithusPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Sprint With Us") }
	static url = "sprintwithus"
	static content = {}
}
