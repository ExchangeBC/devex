package pages.app
import geb.Page

class AuthenticationSigninPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "authentication"
	static content = {
		SignInButton(wait: true) { $("div", 'ng-click': "vm.callOauthProvider('/api/auth/github')") }
		GitLogin(wait: true) { $(id:"login_field") }
		GitPassword(wait: true) { $(id:"password") }
	}
}
