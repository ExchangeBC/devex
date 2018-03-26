import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.OpportunitiesPage
import pages.app.OpportunitiesAdminCreatePage
import pages.app.OpportunitiesAdminCreateLandingPage
import pages.app.OpportunityDetailPage
import pages.app.OpportunitiesAdminEditPage
import pages.app.SignedIn
import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import extensions.AngularJSAware

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

@Narrative("""
  1.  When the save button is selected, all information on the proposal page has been saved to the relevant database locations and 
  that the proposal is in the unpublished state and that a confirmation modal is displayed and that this routine works in all major browsers.
  2.  That upon selecting the publish button, an email containing all relevant opportunity information has been sent to all users 
  (who have signed up to the Developers' Exchange) and that the opportunity is in the published state and 
  that the apply button will appear (and function) on the opportunity page and that a confirmation modal is displayed and 
  that this routine works in all major browsers.
""")
@Title("Create, publish and delete an opportunity.")
class OpportunityCreateSpecs extends GebReportingSpec {
    @Unroll
    def "Publish Opportunity: '#TitleData'" () {
        given: "I have created an opportunity"
            to HomePage
       
            // Need to login as an admin
            def loginOK = login."Login as an adminstrator"("admin","adminadmin","Admin Local")
            //js.exec('window.scrollTo(document.body.scrollHeight,0);')
            assert loginOK
            
            waitFor { to OpportunitiesPage }
            
            when: "I choose to post an opportunity"

            postAnOpportunity
            at OpportunitiesAdminCreateLandingPage

            and: "I choose a 'code with us' opportunity"
            // Choose to post a "Code With Us" Opportunity
            createCWUOpportunityClick
            at OpportunitiesAdminCreatePage

            // Fill in initial details
            selectProject.project = Project //Project
            def RandomID = UUID.randomUUID().toString()
            TitleData = TitleData + ": " + RandomID
            oppTitle.value(TitleData) //Title
            oppTeaser.text = Teaser //teaser
            oppGithub.value(Github) //Github location

            BackgroundTabClick

            "Add Description"(Description)

            DetailsTabClick

            selectLocation.location = Location //Location
            selectOnsite.onsite = Onsite //On site Requirements
           
            oppEmail.value(Email)
            oppEmail << Keys.chord(Keys.TAB)
            // Dates are automatically generated based on current date
            
            "Set All Dates"()
          
            selectEarn.earn = Earn //Fixed Price-Reward
            
            AcceptanceTabClick

            "Add Acceptance Criteria"(AcceptanceCriteria)
            "Add Proposal Criteria"(ProposalCriteria)
            oppSkills.value(Skills) //Skills

            //@todo there's a race and nothing sensible to wait on
            Thread.sleep(3000)
  
            and: "I click the 'save changes' button for the opportunity: '#TitleData'"
            SaveChangesButton.click()
        
            then: "all information on the proposal page has been saved to the relevant database locations"
            waitFor { at OpportunityDetailPage }

            then: "the proposal is in the unpublished state"
            assert { unPublished }

            //js.exec('window.scrollTo(document.body.scrollHeight,0);')

            and: "when published, a confirmation window is displayed"
            oppPublishclick
            waitFor { page.angularReady && oppubYesclick }
            assert { published }

            waitFor { to OpportunitiesPage }
            
            and: "after the test, delete the opportunity: '#TitleData'"    
           // Click the Edit opportunity link to find the opportunity for deletion
            // ex $x('//div[@class = "card"]/div[@class="card-body"]/div[@class="card-title" and contains(., "$RandomID")]')
            $(By.xpath('//div[@class = "card"][div[@class="card-body"]/div[@class="card-title" and contains(., "'+RandomID+'")]]//div[@class="card-header"]//a[i[@class[contains(.,"glyphicon-edit")]]]'), 0).click()
            waitFor { at OpportunitiesAdminEditPage }

            waitFor { page.angularReady && deleteButton }
            assert withConfirm(true) { deleteButton << Keys.chord(Keys.ENTER) } == "Are you sure you want to delete?"
       where:
        Project | TitleData | Teaser | Description | Github | Location | Onsite | Skills | AcceptanceCriteria | Earn | ProposalCriteria | Email 
        "BCDevExchange App" | "Opportunity Creation/Publish/Deletion Test" | "Short Description" | "Some Description" | "https://github.com/rstens/devex.git" | "Victoria" | "onsite" | "Java, JS, css, html, django, python, postgressql" | "Acceptance Criteria" | "\$20,000.00" | "Proposal Evaluation Criteria" | "roland.stens@gmail.com" 
    }
}
