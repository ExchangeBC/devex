package pages.app
import geb.Page

class ApiAuthSignoutPage extends Page {
	static at = { title == "BCDevExchange" && $("a", "ui-sref":"authentication.signin") }
	static url = "api/auth/signout"
	static content = {}
}
