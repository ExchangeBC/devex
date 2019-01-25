package pages.app
import geb.Page
//import extensions.AngularJSAware


//class OrgsListPage extends Page implements AngularJSAware {
//	static at = { angularReady && title == "BCDevExchange - The BC Developer" }
class OrgsListPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "orgs"
	static content = {}
}
