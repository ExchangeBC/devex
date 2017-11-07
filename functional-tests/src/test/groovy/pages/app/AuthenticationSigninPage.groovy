package pages.app
import geb.Page

class AuthenticationSigninPage extends Page {
	static at = { title == "BCDevExchange - Signin" && $("a", "ui-sref":"authentication.signin") }
	static url = "authentication/signin"
	static content = {}
}
