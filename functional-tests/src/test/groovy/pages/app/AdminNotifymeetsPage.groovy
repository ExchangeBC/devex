package pages.app
import geb.Page
import extensions.AngularJSAware

class AdminNotifymeetsPage extends Page {
	static at = { title == "BCDevExchange" && $("h1", text:"Notify of Meet-ups and Events") }
	static url = "admin/notifymeets"
	static content = {}
}
