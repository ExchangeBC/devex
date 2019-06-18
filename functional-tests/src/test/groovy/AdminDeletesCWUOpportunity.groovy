import geb.spock.GebReportingSpec
import geb.*

import pages.app.HomePage
import pages.app.OpportunitiesPage
import pages.app.OpportunityDetailPage

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

@Narrative('''In this test, the ADMIN will delete the existing opportunities: one CWU and one SWU
 ''')

@Title("Admin Deletes opportunities")
class AdminDeletesCWUOpportunity extends GebReportingSpec {         
    def setup() {
        to HomePage
        // Need to login as an admin
        def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
        assert loginOK
    } 

    def "Admin Deletes an CWU opportunity" () {
    
        given: "Starting from the Opportunities Page"
            waitFor {to OpportunitiesPage}

        when: "Click the Edit button on the Opportunity Detail page"
            def oppCount = TestCWUOpportunities.size()
            TestCWUOpportunities[0].click()
            waitFor { at OpportunityDetailPage }
            oppEditButton.click()

        then: "We arrive at the CWU edit opportunity page and click the 'Delete this Opportunity'"
            waitFor{$("a",'data-automation-id':"button-cwu-delete" )}
            $("a",'data-automation-id':"button-cwu-delete" ).click()
            sleep(1000)

        and: "click Yes in the modal box"
            $("button",'data-automation-id':"button-modal-yes" ).click()
            sleep(2000) // Modal box to dissappear after the Yes

        then:"The opportunities page is loaded again"  
            assert waitFor {at OpportunitiesPage}  

        expect: "Confirm the CWU proposal does not exist anymore"
            assert TestCWUOpportunities.size() == oppCount - 1
    }
  }
