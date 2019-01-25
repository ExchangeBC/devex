import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.AuthenticationSigninPage 
import pages.app.SingleProfilePage
import pages.app.GitHubPage
import pages.app.CapabilitiesSkillsPage

import geb.module.RadioButtons

import org.openqa.selenium.By
import org.openqa.selenium.Keys
//import extensions.AngularJSAware

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
 ''')

@Title("Create three users, and assign one capability")
class CreateThreeUsers extends GebReportingSpec {


  @Unroll
  def "Go to Home Page and click on the log to GitHub button as user '#UserFirstName' '#UserLastName'" () {
    given: "Starting from the Home Page"
        to HomePage
        println("URL line 35 is ${driver.currentUrl}")
    when: "I click on the Sign In  link to go to the Authentication page"
        
        SigninLink
        println("URL line 38 is ${driver.currentUrl}")
        at AuthenticationSigninPage 
    and: "Clicking on the Sign in with you GitHub account"
        println("URL line 41 is ${driver.currentUrl}")
        SingInButton.click()

    and: "I arrive to the GitHub page, where I will be able to log using my credentials"
        println("URL line 45 is ${driver.currentUrl}")
        sleep(1000)
        
        assert $("input", name:"commit" )//Verifies the sign in button exists
		$(id:"login_field").value(Login)
		$(id:"password").value(Pwd)
        println("URL line 53 is ${driver.currentUrl}")
        $("input", name:"commit" ).click()
        sleep(1000)
        println("URL line 59 is ${driver.currentUrl}")

    then: "I arrive at the Profile page for the user"
        at SingleProfilePage  //verify we are in the home page

    and: "Check the Name and Last Name have been imported correctly from GitHub"
        assert FirstName.value().toString()==UserFirstName 
        assert LastName.value().toString()==UserLastName

    and: "Now lets write an email address and city"
        emailprofile.value(UserEmail )
        city.value(UserCity)

    and: "Claim a capability- A capability must have been created as precondition"  
        MyCapabilitiesLink.click()
        at CapabilitiesSkillsPage
        First_Skill.click()
        ClaimCapabilityCheck.click()
        sleep(100)
        PreferredTechSkill0.click()
        PreferredTechSkill1.click()
        PreferredTechSkill2.click()
        sleep(100)
    then: "Save the User"   
        SaveChangesButton.click()
        sleep(1000)
    and: "Log out from BC Exchange"
        to HomePage
        def  logoffOK=login."Logout as user"()
        assert logoffOK
        println("URL line 77 is ${driver.currentUrl}")

    and: "Log out from GitHub" 
        to GitHubPage
        sleep(100)
        AvatarImage.click()
        sleep(100)
        SignOutGit.click()
        sleep(1000)

    where: "The values used to create the Opportunity are:"
        Login | Pwd | UserFirstName | UserLastName | UserEmail | UserCity 
        "hugochibougamau" | "Devex_Test1" | "Hugo" | "Chibougamau" | "hugochibougamau@fakeaddress.ca" | "Salt Spring Island"
        "hibouleblanc"|"Devex_Test1" |"Hibou" |"Leblanc"|"hibouleblanc@fakeaddress.ca"|"Victoria"
        "hectorcunniculus"|"Devex_Test1" |"Hector" |""|"hectorcunniculus@fakeaddress.ca"|"Duncan"

  }

  

}
