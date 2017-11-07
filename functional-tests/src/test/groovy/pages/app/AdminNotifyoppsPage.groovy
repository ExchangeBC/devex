package pages.app
import geb.Page

class AdminNotifyoppsPage extends Page {
	static at = { title == "BCDevExchange" && $("h1", text:"Notify of Opportunities") }
	static url = "admin/notifyopps"
	static content = {}
}
