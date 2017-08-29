import geb.Module
import pages.app.HomePage
import pages.app.SignedIn
import geb.spock.GebReportingSpec
import spock.lang.Unroll

/**
 * Example of a Module in Groovy.
 */

class LoginModule extends Module {

    void adminLogin (){
        given:
        to HomePage
        when:
        $("a", text:"Admin Login").click()
        // wait for the login form to render.
        waitFor { $("input", id:"usernameOrEmail") }
        $("input", id:"usernameOrEmail").value("admin")
        $("input", id:"password").value("adminadmin")
        // $("button", text:"Sign in").click()
        $("button", text:"SIGN IN").click()
        then:
        at SignedIn
        waitFor { $("span", "ng-bind":"vm.authentication.user.displayName")[0].text() != "" }
        expect:
        assert $("span", "ng-bind":"vm.authentication.user.displayName")[0].text() == "ADMIN LOCAL"
    }

    void userLogin(){
        given:
            to HomePage
        when:

            $("a","ui-sref":"authentication.signin").click()
            waitFor { $("a", "ng-click":"vm.callOauthProvider('/api/auth/github')")}
            $("a", "ng-click":"vm.callOauthProvider('/api/auth/github')")[0].click()
            $("input", id:"login_field").value("testdevtest")
            $("input", id:"password").value("testtest123")
            $("input", name:"commit").click()
        then:
            at SignedIn
        waitFor { $("span", "ng-bind":"vm.authentication.user.displayName")[0].text() != "" }
        expect:
        assert { $("span", "ng-bind":"vm.authentication.user.displayName")[0].text() != "" }
    }
}
