package pages.app
import geb.Page
import extensions.AngularJSAware

class ProgramsPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Programs List") }
	//static at = { title == "BCDevExchange - Programs List" }
	static url = "programs"
	static content = {}
}
