import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.OpportunitiesPage
import pages.app.OpportunitiesAdminCreatePage
import pages.app.OpportunityDetailPage
import pages.app.OpportunitiesAdminEditPage
import pages.app.SignedIn
import geb.module.RadioButtons
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
            js.exec('window.scrollTo(document.body.scrollHeight,0);')
            assert loginOK
            
            waitFor { to OpportunitiesPage }
            
            // Choose "Post an Opportunity"
            postAnOpportunity
            at OpportunitiesAdminCreatePage 
            
            // Fill in details
            opportunityTypeCd.checked = "code-with-us"
            selectProject.project = Project //Project
            def RandomID = UUID.randomUUID().toString()
            TitleData = TitleData + ": " + RandomID
            oppTitle.value(TitleData) //Title
            oppTeaser.text = Teaser //teaser
            "Add Description"(Description)

            //oppRole.jquery.click()

            oppGithub.value(Github) //Github location
            selectLocation.location = Location //Location
            selectOnsite.onsite = Onsite //On site Requirements
            oppSkills.value(Skills) //Skills
           
            "Add Acceptance Criteria"(AcceptanceCriteria)
            selectEarn.earn = Earn //Fixed Price-Reward
            "Add Proposal Criteria"(ProposalCriteria)
            oppEmail.value(Email)
            oppEmail << Keys.chord(Keys.TAB)
            
            // Dates are automatically generated based on current date
            "Set All Dates"()

        when: "the save button is selected for opportunity: '#TitleData'"
            at OpportunitiesAdminCreatePage 
            js.exec('window.scrollTo(document.body.scrollHeight,0);')
            waitFor { upperSaveButton << Keys.chord(Keys.ENTER) }

        then: "all information on the proposal page has been saved to the relevant database locations"
            waitFor { at OpportunityDetailPage }

        and: "the proposal is in the unpublished state"
            assert oppDetailTitle == TitleData
            assert { unPublished }
        and: "when published, a confirmation window is displayed"
            //$("a", text:"Publish").click()
            oppPublishclick
            waitFor { page.angularReady && oppubYesclick }
            assert { published }

            waitFor { to OpportunitiesPage }

        and: "after the test, delete the opportunity: '#TitleData'"    
           // Click the Edit opportunity link to find the opportunity for deletion
            waitFor { $("a", href: endsWith("$RandomID/edit")) << Keys.chord(Keys.ENTER) }
            waitFor { at OpportunitiesAdminEditPage }

            waitFor { page.angularReady && deleteButton }
            assert withConfirm(true) { deleteButton << Keys.chord(Keys.ENTER) } == "Are you sure you want to delete?"

       where:
        Project | TitleData | Teaser | Description | Github | Location | Onsite | Skills | AcceptanceCriteria | Earn | ProposalCriteria | Email 
        "BCDevExchange App" | "Opportunity Creation/Publish/Deletion Test" | "Short Description" | "Some Description" | "https://github.com/rstens/devex.git" | "Victoria" | "onsite" | "Java, JS, css, html, django, python, postgressql" | "Acceptance Criteria" | "\$20,000.00" | "Proposal Evaluation Criteria" | "roland.stens@gmail.com" 
    }
}
