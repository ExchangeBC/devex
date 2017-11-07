package pages.app
import geb.Page

class AuthenticationSigninadminPage extends Page {
	static at = { title == "BCDevExchange - Signin" && $("a", "ui-sref":"authentication.signin") }
	static url = "authentication/signinadmin"
	static content = {}
}
