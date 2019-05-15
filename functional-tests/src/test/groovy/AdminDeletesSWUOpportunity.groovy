import geb.spock.GebReportingSpec
import geb.*

import pages.app.HomePage
import pages.app.OpportunitiesPage
import pages.app.OpportunityDetailPage

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

@Narrative('''In this test, the Administrator will delete an existing SWU opportunity''')

@Title("Admin Deletes opportunity")
class AdminDeletesSWUOpportunity extends GebReportingSpec {         
    def setup() {
        to HomePage
        // Need to login as an admin
        def  loginOK = login."Login As An Administrator"("admin","adminadmin","Admin Local")
        assert loginOK
    } 

    def "Admin Deletes an SWU opportunity" () {
    
        given: "Starting from the Opportunities Page"
            waitFor {to OpportunitiesPage}

        when: "Click the Edit button on the Opportunity Detail page"
            def oppCount = TestSWUOpportunities.size()
            TestSWUOpportunities[0].click()
            waitFor {at OpportunityDetailPage}
            oppEditButton.click()
            
        then: "We arrive at the SWU edit opportunity page and click the 'Delete this Opportunity'"
            waitFor{$("a",'data-automation-id':"lnkDeleteOpp" )}
            $("a",'data-automation-id':"lnkDeleteOpp" ).click()
            sleep(1000)

        and: "click Yes in the modal box"
            $("button",'data-automation-id':"button-modal-yes" ).click()
            sleep(2000) //Modal box to dissappear after the Yes

        then:"The opportunities page is loaded again"  
            assert waitFor {at OpportunitiesPage}  

        expect: "Confirm the SWU proposal does not exist anymore"
            assert TestSWUOpportunities.size() == oppCount - 1
    }
  }
