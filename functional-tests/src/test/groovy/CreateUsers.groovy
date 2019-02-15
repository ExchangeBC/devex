import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.AuthenticationSigninPage 
import pages.app.CapabilitiesSkillsPage
import pages.app.GitHubPage
import pages.app.GitHubSignInPage
import pages.app.SingleProfilePage

import geb.module.RadioButtons

import org.openqa.selenium.By
import org.openqa.selenium.Keys

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title


@Narrative('''This test creates three users:
    HugoChibougamau
    HibouleBlanc
    HectorCunniculus
the three of them have already been set up in git.hub. For the three of them the pwd is DEVEX_Test1
It also configure their settings and claim the Cooking capability. This Capability needs to have been
previously set in the system by the administrator

These users will be used in other tests.

The test finish with each user logged off from BC Exchange and GitHub
 ''')

@Title("Create three users, and assign one capability")
class CreateUsers extends GebReportingSpec {

  @Unroll
  def "Go to Home Page and click on the log to GitHub button as user '#UserFirstName' '#UserLastName'" () {
    given: "Starting from the Home Page"
        waitFor {to HomePage}

    when: "Click on the Sign In  link to go to the Authentication page"
        SigninLink //The definition for this element includes a Click
        at AuthenticationSigninPage 

    and: "Click on the: 'Sign in with you GitHub account'"
        SignInButton.click()

    and: "Arrive to the GitHub login page, where we will be able to log using the credentials '#Login' and '#Pwd'"
        at GitHubSignInPage
        waitFor{GitHubSignInButton} //If this element is present the page has loaded
		GitHubLogin.value(Login)
		GitHubPwd.value(Pwd)
        GitHubSignInButton.click()

    then: "After successful Login, arrive at the Profile page for the user"
        at SingleProfilePage  //verify we are in the user's settings page

    and: "Check the Name and Last Name have been imported correctly from GitHub"
        assert FirstName.value().toString()==UserFirstName 
        assert LastName.value().toString()==UserLastName

    and: "Now lets write an email address and city"
        emailprofile.value(UserEmail )
        city.value(UserCity)

    and: "Claim a capability. As precondition a capability with three preferred skills must already exist"  
        MyCapabilitiesLink.click()
        at CapabilitiesSkillsPage
        waitFor{First_Skill} //Make sure the skills have shown up
        First_Skill.click()
        ClaimCapabilityCheck.click()
        waitFor{PreferredTechSkill0} //Make sure the preferred skills have shown up
        PreferredTechSkill0.click()
        PreferredTechSkill1.click()
        PreferredTechSkill2.click()

    then: "Save the User"   
        SaveChangesButton.click()
       
    and: "Log out user '#UserFirstName' from BC Exchange"
        waitFor{to HomePage}
        def  logoffOK=login."Logout as user"()
        assert logoffOK

    and: "Log out user '#UserFirstName' from GitHub" 
        waitFor{to GitHubPage}
        AvatarImage.click()
        waitFor{SignOutGit}
        SignOutGit.click()


    where: "The values used to create the Opportunity are:"
        Login | Pwd | UserFirstName | UserLastName | UserEmail | UserCity 
        "hugochibougamau" | "Devex_Test1" | "Hugo" | "Chibougamau" | "hugochibougamau@fakeaddress.ca" | "Salt Spring Island"
        "hibouleblanc"|"Devex_Test1" |"Hibou" |"Leblanc"|"hibouleblanc@fakeaddress.ca"|"Victoria"
        "hectorcunniculus"|"Devex_Test1" |"Hector" |""|"hectorcunniculus@fakeaddress.ca"|"Duncan"

  }

  

}
