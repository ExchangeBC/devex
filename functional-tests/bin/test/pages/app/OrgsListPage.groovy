package pages.app
import geb.Page
import extensions.AngularJSAware


class OrgsListPage extends Page implements AngularJSAware {
	static at = { angularReady && title == "BCDevExchange - Orgs List" }
	static url = "orgs"
	static content = {}
}
