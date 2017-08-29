package pages.app

import geb.Page

class SignedIn extends Page {
    static at = { $("span", "ng-bind":"vm.authentication.user.displayName") }
    static url = "/"
}
