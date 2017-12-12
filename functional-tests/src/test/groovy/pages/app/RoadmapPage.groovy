package pages.app
import geb.Page
import extensions.AngularJSAware

class RoadmapPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Roadmap") }
	//static at = { title == "BCDevExchange - Roadmap" }
	static url = "roadmap"
	static content = {}
}
