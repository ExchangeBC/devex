package pages.app
import geb.Page
import extensions.AngularJSAware

class AuthenticationSigninPage extends Page {
	static at = { title == "BCDevExchange - Signin" && $("a", "ui-sref":"authentication.signin") }
	static url = "authentication/signin"
	static content = {}
}
