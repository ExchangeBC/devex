package pages.app
import geb.Page
import extensions.AngularJSAware

class AdminUsersPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Users List") }
	//static at = { title == "BCDevExchange - Users List" }
	static url = "admin/users"
	static content = {}
}
