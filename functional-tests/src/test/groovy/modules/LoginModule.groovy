package modules

import geb.spock.GebReportingSpec
import geb.Module
import geb.Browser
import pages.app.HomePage
import pages.app.SettingsProfilePage

import spock.lang.Unroll

import java.io.File
import java.io.IOException

class LoginModule extends Module {

    static content = {
      AdminLogin(wait: true) { $("a", id: "authentication.signinadmin") }
      AdminLoginInput(wait: true) { $("#username") }
      PasswordInput(wait: true) { $("#password") }
      CommitButton(wait: true) { $("button", type:"submit") }
      UserAvatarImage(wait: true) { $("img", 'data-automation-id': "UserAvatarImage" ) }
      LogoutMenuItem(wait: true) { $("a", 'data-automation-id': "lnkSignOut") }
    }
   
    Boolean "Login As An Administrator"(java.lang.String username, java.lang.String password, java.lang.String fullUsername) {
        AdminLogin.click()
        waitFor { AdminLoginInput.displayed }
        AdminLoginInput.value(username)
        PasswordInput.value(password)
        CommitButton.click()  
    }

    Boolean "Login as Local User"() {
        AdminLogin.click()
        waitFor { AdminLoginInput.displayed }
        AdminLoginInput.value('user')
        PasswordInput.value('useruser')
        CommitButton.click()
    }

    Boolean "Logout as user"() {
        if (UserAvatarImage.displayed) {
            UserAvatarImage.click()
            waitFor { LogoutMenuItem.displayed }
            LogoutMenuItem.click()
        }
    }
}
