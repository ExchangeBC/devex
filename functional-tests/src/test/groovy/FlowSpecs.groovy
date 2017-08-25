import geb.spock.GebReportingSpec
import pages.app.HomePage
import pages.app.Disclaimer
import pages.app.SignedIn
import pages.app.OpportunityDetail
import spock.lang.Unroll


import javax.xml.crypto.dsig.SignedInfo


class FlowSpecs extends GebReportingSpec {

    @Unroll
    def "Navigate Page from: #startPage, click Link: #clickLink, Assert Page: #assertPage"(){
	    given: "I start on the #startPage"
			to startPage
        when: "I click on the link #clickLink"
			$("a", text:"$clickLink").click()
        then:
			at assertPage
		
        where:
        startPage             | clickLink                     | clickCount    | timeoutSeconds    || assertPage
        HomePage       		  | "Disclaimer"                  | 1             | 3                 || Disclaimer

    }

    def "3 (b) Applying for an opportunity - not signed in" () {
        given:
            to OpportunityDetail
        expect:
            assert $('div','class':'well-transparent')[0].displayed  == true
    }


    def "4 Proposal Workflow Model" (){

        /**
         * TODO:  Right now this test is dependent on a certain opportunity to be present in the system.
         * The test should be extended to include logging in as an admin and creating an opportunity
         * This way the test will not fail if the specific opportunity referenced in the test is not present.
         */

        /* Start by going to the home page */
        given:
            to HomePage
        when:

            /* Click the sign in link */
            $("a","ui-sref":"authentication.signin").click()
            /* Wait for the github login feature to appear */
            waitFor { $("a", "ng-click":"vm.callOauthProvider('/api/auth/github')")}
            /* Click the Github login link */
            $("a", "ng-click":"vm.callOauthProvider('/api/auth/github')")[0].click()
            /* Fill in the details */
            $("input", id:"login_field").value( System.getenv("TEST_USERNAME"))
            $("input", id:"password").value(System.getenv("TEST_PASSWORD"))
            /* Login */
            $("input", name:"commit").click()
        then:
            /* Wait for the login process to complete */
            at SignedIn
            waitFor { $("span", "ng-bind":"vm.authentication.user.displayName")[0].text() != "" }
        expect:
            assert { $("span", "ng-bind":"vm.authentication.user.displayName")[0].text() != "" }

        /* Apply for the opportunity */
        and:
           to OpportunityDetail
        when:
            $("a",class:"btn btn-lg btn-warning").click()
            waitFor { $("div",class:"modal-body").displayed == true }
        then:
            /* check that the required fields exist. */
            assert ($("input","name":"firstName").displayed == true)
            assert ($("input","name":"lastName").displayed == true)
            assert ($("input","name":"email").displayed == true)
            assert ($("input","name":"phone").displayed == true)

    }


}
