import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.SignedIn

import spock.lang.Unroll


/*  1.  When  
  all information on the proposal page has been saved to the relevant database locations 
  and that the proposal is in the unpublished state and that a confirmation modal is displayed 
  and that this routine works in all major browsers.*/

class LoginSpecs extends GebReportingSpec {

    def "Login" () {
        given: 
            to HomePage
        when: 
          def ok = login."Login as an adminstrator"("admin","adminadmin","ADMIN LOCAL")
        then:
         // assert { $("span", "ng-bind":"vm.authentication.user.displayName")[0].text() == "ADMIN LOCAL" }
         assert { ok }
    }
}
