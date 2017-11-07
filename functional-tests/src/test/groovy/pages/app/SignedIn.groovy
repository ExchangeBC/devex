package pages.app
import geb.Page
import modules.LoginModule

class SignedIn extends Page {
    static at = { title == "BCDevExchange" && $("span", "ng-bind":"vm.authentication.user.displayName") }
    static url = ""
        static content = {
        login { module LoginModule }
    }
}
