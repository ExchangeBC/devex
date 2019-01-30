package pages.app
import geb.Page
//import extensions.AngularJSAware

//class RoadmapPage extends Page implements AngularJSAware {
//	static at = { angularReady && title.startsWith("BCDevExchange - Roadmap") }
class RoadmapPage extends Page  {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "roadmap"
	static content = {}
}
