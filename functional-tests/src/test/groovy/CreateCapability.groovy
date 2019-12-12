import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.CapabilitiesPage
import pages.app.CapabilitiesSkillsPage
import pages.app.CapabilityCreatePage

import org.openqa.selenium.By
import org.openqa.selenium.Keys

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

@Narrative
('''This test creates one capability named'Cooking'with three skills associated to it''')

@Title("Create one capability and three skills")
class CreateCapability extends GebReportingSpec {

    def setupSpec() {
        to HomePage
        // Need to login as an admin
        def loginOK = login."Login As An Administrator"("admin","adminadmin","Admin Local")
        assert loginOK
    }

    @Unroll 
    def"Go to Home Page and click on the Admin menu item to open the drop down list"() {
        given: "Starting from the Home Page"
            waitFor {to HomePage}

        when: "Click on the Admin Menu item to expand the drop down options"
            waitFor{AdminMenuDropDown}
            AdminMenuDropDown.click()
    
        and:"Click on the Manage Capabilities option"  
            waitFor{ManageCapabilities}
            ManageCapabilities.click()
        
        then: "Arrive at the Capabilities Page'"
            waitFor{at CapabilitiesPage}
        
        then: "Click the 'Add a Capability' button"
            waitFor{AddACapability}
            AddACapability.click()

        then: "Arrive at the Capabilities Create Page"
            waitFor{at CapabilityCreatePage}

        and: "Enter values for the new capability"
            waitFor{CapabilityName}
            CapabilityName.value(CapName)
            CapabilityLabel.value(CapLabel)
            waitFor{ DescriptionBox}
            withFrame(DescriptionBox){$("body", id:"tinymce") << CapDescription}

        then: "Save the information"
            waitFor{SaveCapability}
            SaveCapability.click()  

        and: "will add three technical skills"  
            waitFor{AddNewSkillText}
            AddNewSkillText.value("chopping")
            AddNewSkillBtn.click()

            waitFor{AddNewSkillText}
            AddNewSkillText.value("roasting")
            AddNewSkillBtn.click()

            waitFor{AddNewSkillText}
            AddNewSkillText.value("butchering")
            AddNewSkillBtn.click()

        then: "Save the information"
            waitFor{SaveCapability}
            SaveCapability.click()
        


        where: "The values used to create the Capability are:" //Case we want to add more capabilities
            CapName | CapLabel| CapDescription
            "Cooking" | "Kitchen" | "Tossing veggies, chooping onions, skinning rabbits, roasting full pigs... all this without accidents"
    }
}
