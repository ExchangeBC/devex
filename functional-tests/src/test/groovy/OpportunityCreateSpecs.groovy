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


/*  1.  When  
  all information on the proposal page has been saved to the relevant database locations 
  and that the proposal is in the unpublished state and that a confirmation modal is displayed 
  and that this routine works in all major browsers.*/

class OpportunityCreateSpecs extends GebReportingSpec {
    @Unroll
    def "Publish Opportunity: '#Title'" () {
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
            Title = Title + ": " + RandomID
            oppTitle.value(Title) //Title
            oppTeaser.text = Teaser //teaser
            "Add Description"(Description)

            oppRole.jquery.click()

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

        when: "the save button is selected"
            at OpportunitiesAdminCreatePage 
            js.exec('window.scrollTo(document.body.scrollHeight,0);')
            waitFor { upperSaveButton << Keys.chord(Keys.ENTER) }

        then: "all information on the proposal page has been saved to the relevant database locations"
            waitFor { at OpportunityDetailPage }

        and: "the proposal is in the unpublished state"
            assert { unPublished }
        and: "a confirmation modal is displayed"
            //Modal Check
            assert oppDetailTitle == Title 
            
            waitFor { to OpportunitiesPage }
            
           // Click the Edit opportunity link
            waitFor { $("a", href: endsWith("$RandomID/edit")) << Keys.chord(Keys.ENTER) }
            waitFor { at OpportunitiesAdminEditPage }

            waitFor { page.angularReady && deleteButton }
            assert withConfirm(true) { deleteButton << Keys.chord(Keys.ENTER) } == "Are you sure you want to delete?"

       where:
        Project | Title | Teaser | Description | Github | Location | Onsite | Skills | AcceptanceCriteria | Earn | ProposalCriteria | Email 
        "BCDevExchange App" | "Test" | "Short Description" | "Some Description" | "https://github.com/rstens/devex.git" | "Victoria" | "onsite" | "Java, JS, css, html, django, python, postgressql" | "Acceptance Criteria" | "\$20,000.00" | "Proposal Evaluation Criteria" | "roland.stens@gmail.com" 
    }
}
