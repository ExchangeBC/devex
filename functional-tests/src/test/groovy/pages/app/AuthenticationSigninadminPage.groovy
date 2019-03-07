package pages.app
import geb.Page
//import extensions.AngularJSAware

//class AuthenticationSigninadminPage extends Page implements AngularJSAware {
//	static at = { angularReady && title == "BCDevExchange - Signin" && $("a", "ui-sref":"authentication.signin") }
class AuthenticationSigninadminPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "authentication/signinadmin"
	static content = {
		Username { $("input", id: "username")}
        Password { $("input", id: "password")}

        SignInButton { $("button", 'data-automation-id': "btnAdminSignIn")}
	}
}
