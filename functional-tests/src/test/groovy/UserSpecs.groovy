/*
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

// package specs

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
import spock.lang.Stepwise

@Stepwise
@Title('Dev Exchange User Tests')
@Narrative('''As a regular user, I want to create, update, and delete my user profile.''')
class UserSpecs extends GebReportingSpec {

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
  
  void 'Creating a user profile'() {
    given: "Starting from the Home Page"
      //to HomePage
      waitFor {to HomePage}
    and: 'I click on the Sign In link to go to the Authentication page'
      SigninLink //The definition for this element includes a Click
      at AuthenticationSigninPage 
    and: 'I click on the "Sign in with your GitHub" account button'
      SignInButton.click()
    and: "Arrive to the GitHub login page, where we will be able to log using the credentials '#Login' and '#Pwd'"
      at GitHubSignInPage
      waitFor{GitHubSignInButton} //If this element is present the page has loaded
		  GitHubLogin.value(Login)
		  GitHubPwd.value(Pwd)
      GitHubSignInButton.click()
      sleep(2000) //Leave time case the next page is the reauthorization page
    and: "If redirected to the reauthorization page, click to reauthorize"    
      assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

    and: "After successful Login, arrive at the Profile page for the user"
        at SingleProfilePage  //verify we are in the user's settings page

    and: "Check the Name and Last Name have been imported correctly from GitHub"
        waitFor{FirstName}
        assert FirstName.value().toString()==UserFirstName 
        assert LastName.value().toString()==UserLastName

    and: "Now lets write an email address and city"
        emailprofile.value(UserEmail)
        city.value(UserCity)

    // and: "Claim a capability. As precondition a capability with three preferred skills must already exist"  
    //     MyCapabilitiesLink.click()
    //     at CapabilitiesSkillsPage
    //     waitFor{First_Skill} //Make sure the skills have shown up
    //     First_Skill.click()
    //     ClaimCapabilityCheck.click()
    //     waitFor{PreferredTechSkill0} //Make sure the preferred skills have shown up
    //     PreferredTechSkill0.click()
    //     PreferredTechSkill1.click()
    //     PreferredTechSkill2.click()

    when: 'I save the company'  
      SaveChangesButton.click()

    then: 'New user profile created'
      // TODO: Check user list for user
      assert emailprofile.value().toString() == UserEmail
      assert city.value().toString() == UserCity
       
    // and: "Log out user '#UserFirstName' from BC Exchange"
    //   waitFor{to HomePage}
    //   def  logoffOK=login."Logout as user"()
    //   assert logoffOK

    // and:"Arrive to the GitHubPage"
    //   waitFor{to GitHubPage}

    // and: "Log out user '#UserFirstName' from GitHub"     
    //   waitFor{AvatarImage}
    //   AvatarImage.click()
    //   waitFor{SignOutGit}
    //   SignOutGit.click() 

    where:
      Login | Pwd | UserFirstName | UserLastName | UserEmail | UserCity 
      "hugochibougamau" | "Devex_Test1" | "Hugo" | "Chibougamau" | "hugochibougamau@fakeaddress.ca" | "Salt Spring Island"
  }

  void 'Editing a user profile'() {
    given: 'I am logged in as an regular user'
    and: "I have navigated to the Home Page"
        waitFor{to HomePage}  //verify we are in the user's settings page
        sleep(1000)

    and:"Click on the Setting options of the drop down"  
        AvatarImage.click() //Click on the icon, it will open the drop down menu
        SettingsOption.click() //Click the settings option of the drop down menu

    and:"We arrive to the Settings page for the Hugo user"
        waitFor{at SingleProfilePage}  //verify we are in the user's settings page
        sleep(1000)


    // Modify this
    and: "Check the Name and Last Name have been imported correctly from GitHub"
        assert FirstName.value().toString()=="Hugo"
        assert LastName.value().toString()=="Chibougamau" 

     // TODO: test moving "Update email address" and "Update city" methods to related Page object   

    and: "Now lets write an email address and city"
        // emailprofile.value("hugochibougamau@EditedFakeaddress.ca" )
        // city.value("Malcom Island")
        to SingleProfilePage
        setEmailAddress(NewUserEmail)
        setCity(NewUserCity)     
        sleep(1000)

    when: "I save the edits to the user profile"   
        SaveChangesButton.click()

    then: "The user profile is updated"    
        assert FirstName.value().toString()=="Hugo"
        assert LastName.value().toString()=="Chibougamau" 
        assert emailprofile.value().toString()=="new@new.com" 
        assert city.value().toString()=="New City"

where:
    NewUserEmail | NewUserCity
    "new@new.com" | "New City"

  }

  // void 'Deleting a user profile'() {
  //   given: 'I am logged in as an admin user'
  //   and: 'I select a company'
  //     selectCompany('.*edit company.*')
  //   when: 'I delete the company'
  //     clickDeleteButton()
  //     at ConfirmDeleteModal
  //     confirmDelete()
  //   then: 'The company is deleted'
  //     at OrganizationsPage
  //     deleteCompanySuccessAlertDisplayed('edit company')
  // }
}