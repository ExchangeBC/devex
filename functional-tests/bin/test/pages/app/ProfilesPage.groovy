package pages.app
import geb.Page
//import extensions.AngularJSAware

class ProfilesPage extends Page {
	static at = { title.startsWith("BCDevExchange - Profiles List") }
	//static at = { title == "BCDevExchange - Profiles List" }
	static url = "profiles"
	static content = {}
}
