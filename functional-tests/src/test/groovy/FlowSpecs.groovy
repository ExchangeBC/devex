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


  //  def "3 (b) Applying for an opportunity - not signed in" () {
  //    given:
  //      to OpportunityDetail
  //    expect:
  //        assert $('div','class':'well.well-info')[0].displayed  == true
  //  }

}
