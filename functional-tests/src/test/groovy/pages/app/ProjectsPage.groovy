package pages.app
import geb.Page
import extensions.AngularJSAware

class ProjectsPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Projects List") }
	//static at = { title == "BCDevExchange - Projects List" }
	static url = "projects"
	static content = {}
}
