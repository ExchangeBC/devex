import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.CapabilitiesPage

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title


@Narrative('''In this test the Admin deletes an existing capability''')

@Title("Create one capability and three skills")
class AdminDeletesCapability extends GebReportingSpec {

    def setup() {
        to HomePage
        // Need to login as an admin
        def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
        assert loginOK
    }

  def "Go to Home Page and click on the Admin menu item to open the drop down list" () {
    given: "Starting from the Home Page"
        waitFor {to HomePage}

    when: "Click on the Admin Menu item to expand the drop down options"
        waitFor{AdminMenuDropDown}
        AdminMenuDropDown.click()
        sleep(1000) //Despite all the waitFor{}, this seems to be necessary
   
    and:"Click on the Manage Capabilities option"  
        waitFor{ManageCapabilities}  
        ManageCapabilities.click() 
     
    then: "Arrive at the Capabilities Page'"
        waitFor{at CapabilitiesPage}
        def capCount = CapabilityCookingEntries.size()
    
    when: "Click the first listed capability"
        waitFor{CapabilityCookingEntries[0].click()}

    and: "Click on the 'pencil' icon"
        waitFor{$('data-icon':"pencil-alt").click()} //Use inline, as the name of the page change with the capability
  
    then: "Arrive at the page that allows to edit/delete the Capability"
        waitFor{$('data-automation-id':"btnDeleteCapability").click()} //As before, the name of the page change with the capability
  
    and: "Click in the yes button of the modal box"
        waitFor{$("button",'data-automation-id':"button-modal-yes").click()}

    then: "Verify there are no capabilities left in the list"
        waitFor{at CapabilitiesPage}
        assert (!CapabilityCookingEntries || CapabilityCookingEntries.size() == capCount - 1)

     }

}
