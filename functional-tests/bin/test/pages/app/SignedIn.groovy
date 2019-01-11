package pages.app
import geb.Page
import modules.LoginModule
import extensions.AngularJSAware

class SignedIn extends Page implements AngularJSAware {
	static at = { angularReady && title == "BCDevExchange" && $("span", "ng-bind":"vm.authentication.user.displayName") }
    //static at = { title == "BCDevExchange" && $("span", "ng-bind":"vm.authentication.user.displayName") }
    static url = ""
        static content = {
        login { module LoginModule }
    }
}
