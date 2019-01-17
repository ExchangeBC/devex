import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.CompaniesPage
import pages.app.SignedIn

import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys
//import extensions.AngularJSAware


import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

import geb.spock.GebReportingSpec


@Title("Validate I can click on the Code with us")
class GoToCodeWithUs extends GebReportingSpec {

    static content= {
            LearnCodeWithUs {$("button-codewithus")}
            LearnSprintWithUs {$("button-sprintwithus")}           
	}
    void LearnCodeWithUs() {
            LearnCodeWithUs.click()
	}    
    void LearnSprintWithUs() {
        LearnSprintWithUs.click()
	}
    }




    def "Test that an unauthenticated user doesn't see the register company button" () {
        given:
            to HomePage
            
            when: "I go to the companies page as an unauthenticated user"
            waitFor { to CompaniesPage }

            then: "I should not see a 'register company' button"
            assert { !RegisterCompanyButton }
    }

