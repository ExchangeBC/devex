import geb.spock.GebReportingSpec
import geb.module.*

import pages.app.HomePage
import pages.app.AuthenticationSigninPage
import pages.app.InitialCWUProposalPage
import pages.app.CodewithusPage
import pages.app.GitHubPage_ReadGuide
import pages.app.GitHubSignInPage
import pages.app.OpportunitiesPage
import pages.app.SettingsProfilePage

import modules.LoginModule

import org.openqa.selenium.By
import org.openqa.selenium.Keys

import spock.lang.Stepwise
import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

@Narrative('''In this test, the user 'HugoChibougamau' logs into the system and creates a CWU proposal
and saves it. Later it updates the proposal and submits it. Finally, Hugo logs again to check the information 
was submitted has been correctly saved.
 ''')

@Stepwise

@Title("Code with Us Happy Path 1")
class CWU_HappyPath_1 extends GebReportingSpec {
     
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

    //We make sure we are not logged as admin
    def setup() {
        waitFor{to HomePage}
        //I get the base URL to build (in the LoginModule) the URL to the admin icon
        def baseURL = getBrowser().getConfig().getBaseUrl().toString()

        // Login off as an admin
        def logoffOK = login."Logout as administrator"(baseURL)
        assert logoffOK
    }

    def "From the Home Page to the CWU" () {

        given: "Starting at the Home Page"
            waitFor { to HomePage}

        when: "I click on Learn More button"
            LearnMoreCWU

        then: "I should be at the CodeWithUs Page- So the page exists"
            waitFor{at CodewithusPage}

        and: "Check Developers button is active"
            assert DevelopersButtonClass=="nav-link active"

        and: "Check the Public Sector Product Managers link is inactive"
            assert PublicSectorProductManagers=="nav-link"

        and: "Click on the 'Read the Guide button' to end in the 'https://github.com/BCDevExchange/code-with-us/wiki/3.--For-Developers:-How-to-Apply-on-a-Code-With-Us-Opportunity' page"
            ReadtheGuideLink.click()
            sleep(3000) //time to download the document
            assert GitHubPage_ReadGuide
    }


    def "In this section the user logs, submits a proposal" () {
        given: "Starting with the Code with Us Page"
            waitFor{to CodewithusPage}

        when: "I click in the Browse Opportunities Button "
            BrowseOpportunitiesLink
            sleep(1000) 

        then: "I should be at the Opportunities Page- So the page exists"
            assert waitFor{OpportunitiesPage}
            at OpportunitiesPage

        and: "I click on the first opportunity listed on the page"
            def OppTitle = TestCWUOpportunities[0].text()  //Opportunity title
            def MyCurrentURL=getCurrentUrl() //URL opportunity page
            //The following is to create from the opp title the URL
            def OppURL= MyCurrentURL + "/cwu/opp-" + OppTitle.replaceAll(' ','-').replaceAll(':','-').toLowerCase()
            TestCWUOpportunities[0].click()
            sleep(1000)

            def NewURL=getCurrentUrl() //This is the specific opportunity URL

        then: "We have arrived to the selected opportunity URL"
            assert NewURL==OppURL
            sleep(1000)

        and: "Click on the Authenticate button"
            $('a[id = "authentication.signin"]').click()
            assert(1000)
            assert AuthenticationSigninPage
            sleep(1000)
            at AuthenticationSigninPage
            SignInButton.click()
            sleep(1000)

        and: "I arrive to the GitHub page, where I will be able to log"
            assert waitFor{$("input", name:"commit" )}//Verifies the sign in button exists
            $(id:"login_field").value('hugochibougamau')
            $(id:"password").value('Devex_Test1')
            $("input", name:"commit" ).click()
            sleep(2000) //Leave time case the next page is the reauthorization page

        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

        then: "Once logged we are in the HomePage. Here we verify the default user icon is there proving we are logged"
            at HomePage  //verify we are in the home page
            def AdminIconLocation = 'https://avatars1.githubusercontent.com/u/46409451?v=4' //This is the default icon for a logged user
            assert $("img",src:"${AdminIconLocation}")

        and: "Click the Browse Opportunities button"
            BrowseOpportunities.click()

        then: "We return to the Opportunities page"
            at OpportunitiesPage
            sleep(1000)

        when: "I click again on the first opportunity listed on the page, this time as a logged-in user"
            OppTitle =TestCWUOpportunities[0].text()  //Opportunity title
            MyCurrentURL=getCurrentUrl() //URL opportunity page
            //The following is to create from the opp title the URL
            OppURL= MyCurrentURL + "/cwu/opp-" + OppTitle.replaceAll(' ','-').replaceAll(':','-').toLowerCase()
            TestCWUOpportunities[0].click()
            sleep(2000)//Give time to navigate to the new specific opp
            NewURL=getCurrentUrl() //This is the specific opportunity URL
            
        then: "We have arrived to the selected opportunity URL"
            assert NewURL==OppURL

        and: "Click on Start a proposal button"
            $("button",id:"proposaladmin.create",0).click()
            sleep(1000)

        then: " Arrive to the page that allows to submit a proposal"
            waitFor{at InitialCWUProposalPage}

        and: "Enter a value in the address field"
            Address.value("999 Rainbow Road")

        and: "Confirm the Company tab is present but disabled"
            assert !$(('a[class~= "nav-link ng-binding disabled"]'),0).empty()

        and: "Confirm the attachment tab is not even present "
            assert(!AttachmentTab.displayed)

        and: "User saves this first draft"
            ButtonSaveChanges.click()
            sleep(2000) //to give time to tha angular message to appear and dissappear

        and: "Because terms are not accepted, check there is warning message to the user indicating it can not be submitted"
            assert MustAgreeTermsMsg.text().contains("Before you can submit your Proposal, you must agree to the Terms.")

        and: "Click the Terms tab"
            TermsTab.click()

        and: "Accept the terms. If not accepted we can not submit"
            CheckTerms.click()

        then: "Check the Attachment tab is present"
            assert(AttachmentTab.displayed)

        and: "Click on the Attachment tab"  
            // At this moment I do not know how to upload a file
            AttachmentTab.click()   
        
        and: "Click on the Proposal tab"  
            waitFor{at InitialCWUProposalPage}
            sleep(1000)
            ProposalTab.click()  
            
        and: "Enter text in the description box"      
            waitFor{ProposalDescriptionBox}
            //Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            withFrame(ProposalDescriptionBox){$("body", id:"tinymce") << 'Les Nenes Maques'}
            sleep(2000) //Not sure why, but without this delay the text is not properly saved

        then: "End by saving this draft"
            waitFor{ButtonSaveChanges}
            ButtonSaveChanges.click()
            sleep(2000) //to give time to tha angular message to appear and dissappear
    }


  def "In this section the user updates the previous proposal" () {
      given: "Starting from the Home Page"
            waitFor {to HomePage}
            sleep(1000)
            //Note: in the context of this test, the User Hugo is already logged as we didn't log out in the
            //previous feature, so no need to Authenticate again

      and: "Go to the opportunities page"
            OpportunitiesNavBar //It includes the 'click'

      when: "At the Opportunities page"
            waitFor{at OpportunitiesPage}
 
      and: "I click on the first opportunity listed on the page"
            TestCWUOpportunities[0].click()
            sleep(1000)

      and: "Arrive at the page that allows to edit the proposal"
            waitFor{at InitialCWUProposalPage}

      then: "Click on 'Update My Proposal'"
            UpdateMyProposalLnk.click()
            sleep(1000)

      and: "Click on the 'Payment can be made to a company checkbox'"     
            IsCompanyCheckBox.click() 

      and: "Now the Company tab is visible and we navigate to it"  
            waitFor{ CompanyTab }
            CompanyTab.click()
            sleep(1000)

      and: "Update a couple elements"  
            waitFor{BusinessAddress}    
            BusinessAddress.value("456 Lower Ganges Road")
            BusinessContactPhone.value("250 765 4321")

      then: "Save the changes"  
            waitFor{SaveChangesButton}
            SaveChangesButton.click()
            sleep(1000)
      
      and: "Submit the proposal"
            SubmitProposal.click()
            sleep(1000)
  }


  def "In this section we verify the previous entries and changes have been saved" () {
      given: "Starting from the Opportunities page"
            waitFor{to OpportunitiesPage}
            sleep(1000)
 
      and: "I click on the first opportunity listed on the page"
            waitFor{TestCWUOpportunities}
            TestCWUOpportunities[0].click()
            sleep(1000)

      and: "Arrive at the page that allows to edit the proposal"
            waitFor{at InitialCWUProposalPage}

      when: "Click on 'Update My Proposal'"
            UpdateMyProposalLnk.click()
            sleep(1000)

      then: "We start at the 'Developer' tab. We check a couple fields"
            assert FirstName.value()=='Hugo'
            assert Email.value()=='hugochibougamau@fakeaddress.ca'

      and: "Navigate to the Company tab"  
            waitFor{ CompanyTab }
            CompanyTab.click()
            sleep(1000)

      then: "Check another couple elements in the Company tab"     
            assert BusinessAddress.value()=="456 Lower Ganges Road"
            assert BusinessContactPhone.value()=="250 765 4321"

      and: "Navigate to the Proposal tab"  
            waitFor{ProposalTab  }
            ProposalTab .click()
            sleep(1000)

      then: "Check the description element in the Proposal tab"  
            waitFor{ProposalDescriptionBox}
            //Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            assert withFrame(ProposalDescriptionBox){$("body", id:"tinymce").text()}=='Les Nenes Maques'

  }


        def teardown(){//Logoff as user
            waitFor{to HomePage}
            sleep(1000)  //Do not fully trust waitFor
            def  logoffOK=login."Logout as user"()
            assert logoffOK
        }


}



