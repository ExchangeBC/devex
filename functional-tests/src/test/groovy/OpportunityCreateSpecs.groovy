import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.OpportunitiesPage
import pages.app.OpportunitiesAdminCreatePage
import pages.app.OpportunityDetail
import pages.app.SignedIn

import spock.lang.Unroll


/*  1.  When  
  all information on the proposal page has been saved to the relevant database locations 
  and that the proposal is in the unpublished state and that a confirmation modal is displayed 
  and that this routine works in all major browsers.*/

class OpportunityCreateSpecs extends GebReportingSpec {

    @Unroll
    def "Publish Opportunity" () {
        given: "I have created an opportunity"
            to HomePage
            
            def loginOK = login."Login as an adminstrator"("admin","adminadmin","ADMIN LOCAL")
            assert loginOK
            
            to OpportunitiesPage
            
            postAnOpportunity
            at OpportunitiesAdminCreatePage
            
            // Fill in details
            selectProject.project = Project //Project
            oppTitle.value(Title) //Title
            oppTeaser.text = Teaser //teaser
                       
            waitFor { desciFrame }
            withFrame( desciFrame ) {
              waitFor { mceBody }
              mceBody << Description
            }

            oppGithub.value(Github) //Github location
            selectLocation.location = Location //Location
            selectOnsite.onsite = Onsite //On site Requirements
            oppSkills.value(Skills) //Skills

            waitFor { aciFrame }
            withFrame( aciFrame ) {
              waitFor { mceBody }
              mceBody << AcceptanceCriteria
            }

            selectEarn.earn = Earn //Fixed Price-Reward

            waitFor { propiFrame }
            withFrame( propiFrame ) {
              waitFor { mceBody }
              mceBody << ProposalCriteria
            }

            oppEmail.value(Email)
            oppDeadline.val(DeadlineDate) //Proposal Deadline Date
            oppAssignment.val(AssignmentDate) //Assignment Date
            oppStart.val(StartDate) //Start Date


        when: "the save button is selected"
            //Click Bottom save button
            lowerSaveButton.click()
        then: "all information on the proposal page has been saved to the relevant database locations"
            at OpportunityDetail
        and: "the proposal is in the unpublished state"
            assert { unPublished }
        and: "a confirmation modal is displayed"
            //Modal Check
            println oppDetailTitle
            println Title

            assert oppDetailTitle == Title 
        where:
        Project | Title | Teaser | Description | Github | Location | Onsite | Skills | AcceptanceCriteria | Earn | ProposalCriteria | Email | DeadlineDate | AssignmentDate | StartDate
        "BCDevExchange App" | "Hello" | "Short Description" | "Some Description" | "https://github.com/rstens/devex.git" | "Victoria" | "onsite" | "Java, JS, css, html, django, python, postgressql" | "Acceptance Criteria" | "\$20,000.00" | "Proposal Evaluation Criteria" | "roland.stens@gmail.com" | "2018-01-12" | "2018-02-12" | "2018-03-12"
    }
}
