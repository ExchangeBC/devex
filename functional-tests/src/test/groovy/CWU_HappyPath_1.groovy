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

@Narrative('''In this test, the user 'User Local' logs into the system and creates a CWU proposal
and saves it. Later it updates the proposal and submits it. Finally, Hugo logs again to check the information 
was submitted has been correctly saved.
''')

@Stepwise

@Title("Code with Us Happy Path 1")
class CWU_HappyPath_1 extends GebReportingSpec {
    
    def setup() {
        waitFor { to HomePage }
        login."Logout as user"()
    }

    def "From the Home Page to the CWU" () {
        given: "Starting at the Home Page"
            waitFor { to HomePage }

        when: "I click on Learn More button"
            LearnMoreCWU.click()

        then: "I should be at the CodeWithUs Page- So the page exists"
            waitFor { at CodewithusPage }

        and: "Check Developers button is active"
            assert DevelopersButtonClass == "nav-link active"

        and: "Check the Public Sector Product Managers link is inactive"
            assert PublicSectorProductManagers == "nav-link"

        and: "Click on the 'Read the Guide button' to end in the 'https://github.com/BCDevExchange/code-with-us/wiki/3.--For-Developers:-How-to-Apply-on-a-Code-With-Us-Opportunity' page"
            ReadtheGuideLink.click()
            sleep(3000) // Wait to download the document
            assert GitHubPage_ReadGuide
    }


    def "In this section the user logs, submits a proposal"() {
        given: "Starting with the Code with Us Page"
            waitFor { to CodewithusPage }

        when: "I click in the Browse Opportunities Button "
            BrowseOpportunitiesLink.click()

        then: "I should be at the Opportunities Page- So the page exists"
            assert waitFor { OpportunitiesPage }
            at OpportunitiesPage

        and: "I click on the first opportunity listed on the page"
            def OppTitle = TestCWUOpportunities[0].text()
            def MyCurrentURL = getCurrentUrl()
            def OppURL = MyCurrentURL + "/cwu/opp-" + OppTitle.replaceAll(' ','-').replaceAll(':','-').toLowerCase()
            TestCWUOpportunities[0].click()
            sleep(1000)

            def NewURL = getCurrentUrl()

        then: "We have arrived to the selected opportunity URL"
            assert NewURL == OppURL

        and: "Log in as local user"
            login."Login as Local User"();

        and: "Click the Browse Opportunities button"
            waitFor { at HomePage }
            BrowseOpportunities.click()

        then: "We return to the Opportunities page"
            at OpportunitiesPage
            sleep(1000)

        when: "I click again on the first opportunity listed on the page, this time as a logged-in user"
            OppTitle = TestCWUOpportunities[0].text()
            MyCurrentURL = getCurrentUrl()
            OppURL = MyCurrentURL + "/cwu/opp-" + OppTitle.replaceAll(' ','-').replaceAll(':','-').toLowerCase()
            TestCWUOpportunities[0].click()
            sleep(2000)
            NewURL = getCurrentUrl()
            
        then: "We have arrived to the selected opportunity URL"
            assert NewURL == OppURL

        and: "Click on Start a proposal button"
            $("button",id:"proposaladmin.create",0).click()
            sleep(1000)

        then: " Arrive to the page that allows to submit a proposal"
            waitFor { at InitialCWUProposalPage }

        and: "Enter a value in the address field"
            Address.value("999 Rainbow Road")

        and: "Confirm the attachment tab is not present"
            assert(!AttachmentTab.displayed)

        and: "User saves this first draft"
            SaveChangesButton.click()

        and: "Because terms are not accepted, check there is warning message to the user indicating it can not be submitted"
            assert MustAgreeTermsMsg.text().contains("Before you can submit your Proposal, you must agree to the Terms.")

        and: "Click the Terms tab"
            TermsTab.click()

        and: "Accept the terms. If not accepted we can not submit"
            CheckTerms.click()

        then: "Check the Attachment tab is present"
            assert(AttachmentTab.displayed)

        and: "Click on the Attachment tab"  
            AttachmentTab.click()   
        
        and: "Click on the Proposal tab"  
            waitFor { at InitialCWUProposalPage }
            ProposalTab.click()  
            
        and: "Enter text in the description box"      
            waitFor { ProposalDescriptionBox }
            // Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            withFrame(ProposalDescriptionBox) { $("body", id:"tinymce") << 'Les Nenes Maques' }
            sleep(2000)

        then: "End by saving this draft"
            SaveChangesButton.click()
    }

  def "In this section the user updates the previous proposal" () {
    given: "Starting from the Home Page"
        waitFor { to HomePage }

    when: "I log in as local user"
        login."Login as Local User"();

    and: "Go to the opportunities page"
        waitFor { at HomePage }
        BrowseOpportunities.click()

    and: "At the Opportunities page"
        waitFor { at OpportunitiesPage }
 
    and: "I click on the first opportunity listed on the page"
        TestCWUOpportunities[0].click()

    and: "Arrive at the page that allows to edit the proposal"
        waitFor { at InitialCWUProposalPage }

    then: "Click on 'Update My Proposal'"
        UpdateMyProposalLnk.click()

    and: "Click on the 'Payment can be made to a company checkbox'"     
        IsCompanyCheckBox.click() 

    and: "Now the Company tab is visible and we navigate to it"  
        waitFor { CompanyTab }
        CompanyTab.click()

    and: "Update a couple elements"  
        waitFor { BusinessAddress }    
        BusinessAddress.value("456 Lower Ganges Road")
        BusinessContactPhone.value("250 765 4321")

    then: "Save the changes"  
        waitFor { SaveChangesButton }
        SaveChangesButton.click()
      
    and: "Submit the proposal"
        SubmitProposal.click()
  }

  def "In this section we verify the previous entries and changes have been saved"() {

    given: "I log in as local user"
        login."Login as Local User"();

    and: "Starting from the opportunities page"
        waitFor { to OpportunitiesPage }

    and: "I click on the first opportunity listed on the page"
        waitFor { TestCWUOpportunities }
        TestCWUOpportunities[0].click()

    and: "Arrive at the page that allows to edit the proposal"
        waitFor { at InitialCWUProposalPage }

    when: "Click on 'Update My Proposal'"
        UpdateMyProposalLnk.click()

    then: "We start at the 'Developer' tab. We check a couple fields"
        assert FirstName.value() == 'User'
        assert Email.value() == 'user@localhost.com'

      and: "Navigate to the Company tab"  
            waitFor { CompanyTab }
            CompanyTab.click()

      then: "Check another couple elements in the Company tab"     
            assert BusinessAddress.value() == "456 Lower Ganges Road"
            assert BusinessContactPhone.value() == "250 765 4321"

      and: "Navigate to the Proposal tab"  
            waitFor { ProposalTab }
            ProposalTab.click()

      then: "Check the description element in the Proposal tab"  
            waitFor { ProposalDescriptionBox }
            //Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            assert withFrame(ProposalDescriptionBox) { $("body", id:"tinymce").text() } == 'Les Nenes Maques'
    }

    def teardown(){
        waitFor { to HomePage }
        login."Logout as user"()
    }
}
