package pages.app
import geb.Page

class AuthenticationGovernmentPage extends Page {
	static at = { title == "BCDevExchange - Government" && $("a", "ui-sref":"authentication.signin") }
	static url = "authentication/government"
	static content = {}
}
