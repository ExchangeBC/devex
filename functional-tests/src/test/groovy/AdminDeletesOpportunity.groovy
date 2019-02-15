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

@Stepwise

@Narrative('''In this test, the ADMIN will delete one existing opportunity
 ''')

@Title("Admin Deletes an opportunity")
class AdminDeletesOpportunity extends GebReportingSpec {         
    def setup() {
        to HomePage
        // Need to login as an admin
        def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
        assert loginOK
    } 
   
    def "Admin Deletes an CWU opportunity" () {
    
        //def actions = new Actions(driver)
    
        given: "Starting from the Opportunities Page"
            waitFor {to OpportunitiesPage}

        when: "Click on the second listed, CWU, opportunity."
            SecondListedOpportunity.click() 
            
        and: "In the new page, click the 'pencil' button to edit the oportunity"
            waitFor{$("a",'data-automation-id':"button-opportunity-edit" ).click()}

        then: "We arrive at the CWU edit opportunity page and click the 'Delete this Opportunity'"
            waitFor{$("a",'data-automation-id':"button-cwu-delete" ).click()}

        and: "click Yes in the modal box"
            waitFor{$("button",'data-automation-id':"button-modal-yes" ).click()}
            sleep(2000) //Modal box to dissappear after the Yes

        then:"The opportunities page is loaded again"  
            assert waitFor {at OpportunitiesPage}  

        expect: "Confirm the CWU proposal does not exist anymore"
            assert SecondListedOpportunity.empty


    }


    def "Admin Deletes an SWU opportunity" () {
    
        //def actions = new Actions(driver)
    
        given: "Starting from the Opportunities Page"
            waitFor {to OpportunitiesPage}

        when: "Click on the second listed, CWU, opportunity."
            FirstListedOpportunity.click()
            sleep(1000) //Whitouth it, the 'pencil' is 'hovered' but not clicked
            
        and: "In the new page, click the 'pencil' button to edit the oportunity"
            waitFor{$("a",'data-automation-id':"btnEditOpportunity" ).click()}
            sleep(1000)

        then: "We arrive at the SWU edit opportunity page and click the 'Delete this Opportunity'"
            waitFor{$("a",'data-automation-id':"lnkDeleteOpp" ).click()}

        and: "click Yes in the modal box"
            waitFor{$("button",'data-automation-id':"button-modal-yes" ).click()}
            sleep(2000) //Modal box to dissappear after the Yes


        then:"The opportunities page is loaded again"  
            assert waitFor {at OpportunitiesPage}  

        expect: "Confirm the SWU proposal does not exist anymore"
            assert FirstListedOpportunity.empty

    }

  }

