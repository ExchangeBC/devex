package pages.app
import geb.Page
import extensions.AngularJSAware

class NotificationsPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Notifications List") }
	//static at = { title == "BCDevExchange - Notifications List" }
	static url = "notifications"
	static content = {}
}
