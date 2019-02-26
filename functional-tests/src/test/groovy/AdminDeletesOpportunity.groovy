import geb.spock.GebReportingSpec
import geb.*

import pages.app.HomePage
import pages.app.OpportunitiesPage

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title
import spock.lang.Stepwise

//import org.openqa.selenium.WebElement
//import org.openqa.selenium.By



@Narrative('''In this test, the ADMIN will delete the existing opportunities: one CWU and one SWU
 ''')

@Stepwise //Order is important, as the second element of the list must be deleted first

@Title("Admin Deletes opportunities")
class AdminDeletesOpportunity extends GebReportingSpec {         
    def setup() {
        to HomePage
        // Need to login as an admin
        def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
        assert loginOK
    } 

    def "Admin Deletes an SWU opportunity" () {
    
        given: "Starting from the Opportunities Page"
            waitFor {to OpportunitiesPage}
           
        when: "In the new page, click the 'gear' icon to edit the oportunity"
            waitFor{EditOppLnk}
            EditOppLnk.click()
            sleep(2000)

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
            assert SecondListedOpportunity.empty

    }


    def "Admin Deletes an CWU opportunity" () {
    
        given: "Starting from the Opportunities Page"
            waitFor {to OpportunitiesPage}

        when: "In the new page, click the 'gear' icon to edit the oportunity"
            waitFor{EditOppLnk}
            EditOppLnk.click()
            sleep(2000)

        then: "We arrive at the CWU edit opportunity page and click the 'Delete this Opportunity'"
            waitFor{$("a",'data-automation-id':"button-cwu-delete" )}
            $("a",'data-automation-id':"button-cwu-delete" ).click()
            sleep(1000)

        and: "click Yes in the modal box"
            $("button",'data-automation-id':"button-modal-yes" ).click()
            sleep(2000) //Modal box to dissappear after the Yes

        then:"The opportunities page is loaded again"  
            assert waitFor {at OpportunitiesPage}  

        expect: "Confirm the CWU proposal does not exist anymore"
            assert FirstListedOpportunity.empty

    }

  }

