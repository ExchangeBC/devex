package pages.app
import geb.Page
import extensions.AngularJSAware

class AuthenticationSigninadminPage extends Page implements AngularJSAware {
	static at = { angularReady && title == "BCDevExchange - Signin" && $("a", "ui-sref":"authentication.signin") }
	static url = "authentication/signinadmin"
	static content = {}
}
