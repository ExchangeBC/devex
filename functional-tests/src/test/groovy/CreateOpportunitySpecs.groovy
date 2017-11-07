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

class CreateOpportunitySpecs extends GebReportingSpec {

    def "Publish Opportunity" () {
        given: "I have created an opportunity"
            to HomePage
            def loginOK = login."Login as an adminstrator"("admin","adminadmin","ADMIN LOCAL")
            to OpportunitiesAdminCreatePage
            projectSelect
        when: "the save button is selected"
        then: "all information on the proposal page has been saved to the relevant database locations"
        and: "the proposal is in the unpublished state"
        and: "a confirmation modal is displayed"
    }
}
