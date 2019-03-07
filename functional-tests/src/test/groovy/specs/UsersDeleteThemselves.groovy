import geb.spock.GebReportingSpec
import geb.*

import pages.app.HomePage
import pages.app.AuthenticationSigninPage
import pages.app.GitHubPage
import pages.app.GitHubSignInPage
import pages.app.ProfilesPage

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

@Narrative('''In this test, the three users created in the previous tests will log and delete their own profile from the system''')

@Title("Users delete themselves from the system")
class UsersDeleteThemselves extends GebReportingSpec {

    def Boolean CheckIfReauthIsNeeded(){
        if (driver.currentUrl.contains("oauth/authorize?")) { //This is part of the reauthorization page URL
                println("Had to reauthorize Devex to access the GibHub account")
                $("button",name:"authorize").click()  //Click on the reauthorize button to proceed
                sleep(2000)
        }
        else {
                println("No need to reauthorize Devex to access the GibHub account")
        }
        return true
    }
  

    @Unroll
    def "Go to Home Page and click on the log to GitHub button as user '#UserFirstName' '#UserLastName'" () {
        given: "Starting from the Home Page"
            waitFor {to HomePage}

        when: "Click on the Sign In"
            SigninLink //The definition for this element includes a Click

        then: "and arrive to the Authentication page"    
            waitFor{at AuthenticationSigninPage}

        and: "Click on the: 'Sign in with you GitHub account'"
            SignInButton.click()

        and: "Arrive to the GitHub login page, where we will be able to log using the credentials '#Login' and '#Pwd'"
            waitFor{at GitHubSignInPage}
		    GitHubLogin.value(Login)
		    GitHubPwd.value(Pwd)
            GitHubSignInButton.click()
            sleep(2000) //Leave time case the next page is the reauthorization page

        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

        then: "After successful Login, arrive at the Home page again"
            waitFor{at HomePage} 

        and: "Click on the Upper right icon, this will show a drop down list of options" 
            AvatarImage.click()

        and: "Click on the 'Settings' option"     
            waitFor{SettingsOption.click()}

        expect: "Arrive to the Profile Page for this user"
            waitFor{at ProfilesPage}

        when:"Click on the 'Delete my profile' button"
            waitFor{DeleteProfileButton.click()}

        and: "Click yes in the modal window"
            waitFor{$("button",'data-automation-id':"button-modal-yes").click()}

        then:"Because the user #Login does not exist anymore, the upper right icon changes to the generic one"
            assert waitFor{$('data-icon':"github")}


        where: "The values used to delete Users are:"
            Login | Pwd | UserFirstName | UserLastName 
            "hugochibougamau" | "Devex_Test1" | "Hugo" | "Chibougamau" 
            "hibouleblanc"|"Devex_Test1" |"Hibou" |"Leblanc"
            "hectorcunniculus"|"Devex_Test1" |"Hector" |""
    }

 def cleanup() { //it runs after each iteration: Log out the user from GitHub      
        waitFor{to GitHubPage}
        AvatarImage.click()
        waitFor{SignOutGit.click()}
        }  

  }
