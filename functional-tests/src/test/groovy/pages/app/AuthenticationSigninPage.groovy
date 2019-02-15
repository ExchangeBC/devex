package pages.app
import geb.Page
import extensions.AngularJSAware

class AuthenticationSigninPage extends Page {
	static at = { title.startsWith( "BCDevExchange - The BC Developer\'s Exchange ") }
	//static at = { title.startsWith( "The BC Developer's Exchange") && $("a", "ui-sref":"authentication.signin") }

	static url = "authentication"
	static content = {
		SignInButton {$("body > main > section > div > div > div > div")}
		GitLogin{$(id:"login_field")}
		GitPassword{$(id:"password")}
		
	}

}
