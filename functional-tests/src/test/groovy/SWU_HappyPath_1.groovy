
import geb.spock.GebReportingSpec
import geb.module.*

import pages.app.HomePage
import pages.app.AuthenticationSigninPage
import pages.app.InitialSWUProposalPage
import pages.app.GitHubPage
import pages.app.SprintwithusPage
import pages.app.SprintWithUsHowToApplyPage
import pages.app.OpportunitiesPage

import modules.LoginModule

import org.openqa.selenium.By
import org.openqa.selenium.Keys

import spock.lang.Stepwise
import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

@Narrative('''In this test, the already existing Company 'Hugo and friend's Company' created by user
'HugoChibougamau' will bid in a SWU opportunity. The test itself is broken into several parts to make
it easier to identify where the test has failed and also to mimic the user behaviour more closely.
 ''')


@Stepwise

@Title("Sprint with Us Happy Path 1")
class SWU_HappyPath_1 extends GebReportingSpec {

    static OppURL_global=""  //define a global URL for the OpportunityDetailPage associated to the opportunity
    static ProposalURL_global=""  //define a global URL for the Proposal associated to the opportunity
    
    Boolean CheckIfReauthIsNeeded(){
        if (driver.currentUrl.contains("oauth/authorize?")) { //This is part of the reauthorization page URL
                println("Had to reauthorize Devex to access the GibHub account")
                $("button",name:"authorize").click()  //Click on the reauthorize button to proceed
                sleep(2000)
        }
        else {
                println("No need to reauthorize Devex to access the GibHub account")
        }
        return true
    }

    boolean MoveTo(int x,int y){
        int XCoor=x
        int YCoor=y
        js.exec('window.scrollTo('+  XCoor +','+ YCoor +');')
        return true
    }


    def startup() {//We make sure we are not logged as admin
        waitFor{to HomePage}
        //I get the base URL to build (in the LoginModule) the URL to the admin icon
        def baseURL = getBrowser().getConfig().getBaseUrl().toString()

        // Login off as an admin
        def  logoffOK=login."Logout as administrator"(baseURL)
        assert logoffOK
    }

def "Looking at the existing opportunities and SWU information as a non-authenticated user" () {

    given: "Starting at the Home Page"
        waitFor { to HomePage}

    when: "I click on Learn More button under SWU"
        SprintwithusLink

    then: "I should be at the Sprintwithus Page- So the page exists"
        waitFor{at SprintwithusPage}

    and: "Click on the How to Apply button"
        HowToApply.click()

    then: "Arrive at the SWU page that explains how to apply"
        waitFor{at SprintWithUsHowToApplyPage}

    and: "Click on the opportunities link on the header of the page"
        OpportunitiesNavBar //it includes a click

    then: "I should be at the Opportunities Page- So the page exists"
        waitFor{at OpportunitiesPage}

      and: "I click on the first opportunity listed on the page"
        waitFor{TestSWUOpportunities[0]}
        def OppTitle =TestSWUOpportunities[0].text()  //Get the Opportunity title
        def MyCurrentURL=getCurrentUrl() //Should be the URL for the opportunity page
        //The following line createe the URL to access the specific opportunity
        def OppURL= MyCurrentURL + "/swu/opp-" + OppTitle.replaceAll(' ','-').replaceAll(':','-').toLowerCase()
        TestSWUOpportunities[0].click()
        sleep(2000)

    then: "Check the target URL corresponds to the expected opportunity"
        def NewURL=getCurrentUrl() //This is the specific opportunity URL
        assert NewURL==OppURL
}

def "User authenticates and navigates to the proposal to start filling it" () {

    given:"User has read all the conditions and decided to apply. So, first needs to log in by clicking on the Sign In icon"
        $('a[id = "authentication.signin"]').click()

    when: "arrives to the authentication page"
        waitFor{at AuthenticationSigninPage}
        assert AuthenticationSigninPage

    and:"User clicks th 'Sign In' button in the Authentication page"
        waitFor{SignInButton.click()}
        sleep(1000)

    and: "User arrive to the GitHub page, where will be able to log"
        assert waitFor{$("input", name:"commit" )}//Verifies the sign in button exists
		$(id:"login_field").value('hugochibougamau')
		$(id:"password").value('Devex_Test1')
        $("input", name:"commit" ).click()
        sleep(2000) //Leave time case the next page is the reauthorization page

    and:"If redirected to the reauthorization page, click to reauthorize"    
        assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

    then: "Once logged the application redirects to the HomePage. Here we verify the default user icon is there proving we are logged"
        waitFor {at HomePage}
        def AdminIconLocation = 'https://avatars1.githubusercontent.com/u/46409451?v=4' //This is the default icon for a logged user
        assert $("img",src:"${AdminIconLocation}")

    and: "Click the Browse Opportunties button"
        waitFor{BrowseOpportunities.click()}

    then: "We return to the Opportunities page"
        waitFor{at OpportunitiesPage}
        sleep(1000)

    when: "User clicks again on the opportunity she visited in the previous feature, this time as a logged-in user"
        //Because we are in another bloc of code these variables need to be defined them again
        waitFor{TestSWUOpportunities}
        def OppTitle =TestSWUOpportunities[0].text()  //Opportunity title
        def MyCurrentURL=getCurrentUrl() //URL opportunity page
        //The following is to create from the opp title the URL
        def OppURL= MyCurrentURL + "/swu/opp-" + OppTitle.replaceAll(' ','-').replaceAll(':','-').toLowerCase()
        TestSWUOpportunities[0].click()  //Same opportunity as before
        sleep(1000)
        def NewURL=getCurrentUrl() //This is the specific opportunity URL

    then: "User arrives to the selected opportunity URL"
        assert NewURL==OppURL  //OppURL was defined before. This step is a bit paranoid, and may be deleted

    when: "Click on Start a proposal button"
        OppURL_global=driver.currentUrl   //Save to a global variable. It is the Opportunity URL that will be used in the following tests
        waitFor{$("button",0, id:"proposaladmin.create").click()}
        sleep(1000)
        ProposalURL_global=driver.currentUrl //Save to a global variable. It is the Proposal URL that will be used in the following tests

    then: "Loads the page that allows to fill the proposal for the selected opportunity"
        assert waitFor{at InitialSWUProposalPage}

}

def "User start filling the proposal without completing it. Then saves the entries and leaves with the proposal unsubmitted" () {
    //Note: We are already logged as the user, so no need to log again
    given:"Authenticated user starts a proposal after Clicking on start a proposal button"
        go ProposalURL_global  //defined in the previous feature
        waitFor{at InitialSWUProposalPage}  //this page definition does not have a URL, as it changes with the opportunity


    when: "We download the code challenge"
        waitFor{CodeChallengeDownload.click()}
        sleep(2000)//Give time to download the document

    then: "Move to the Terms tab"
        TermsTab.click()

    and: "Move to the Select Team tab"
        SelectTeamTab.click()

    and: "Select the first user on the Inception Phase list"
        InceptionPhaseTeamMember1.click()
        sleep(1000)

    and: "Verify the selected team member changes appearance, providing feedback to the user indicating it has been selected"
        assert InceptionPhaseTeamMember1.@class=="font-weight-bold p-2 border ng-scope bg-primary text-white"

    and: "Verify the second (uselected) team member has not changed the appearance"
        assert InceptionPhaseTeamMember2.@class=="font-weight-bold p-2 border ng-scope"

    and: "Select the second user on the Prototype Phase list"
        PrototypePhaseTeamMember2.click()
        sleep(1000)

    and: "Verify the selected team member changes appearance, providing feedback to the user indicating it has been selected"
        assert PrototypePhaseTeamMember2.@class=="font-weight-bold p-2 border ng-scope bg-primary text-white"

    and: "Verify the first (uselected) team member has not changed the appearance"
        assert PrototypePhaseTeamMember1.@class=="font-weight-bold p-2 border ng-scope"

    and: "Select the second user on the Implementation Phase list"
        ImplementationPhaseTeamMember1.click()
        sleep(1000)

    and: "Verify the selected team member changes appearance, providing feedback to the user indicating it has been selected"
        assert ImplementationPhaseTeamMember1.@class=="font-weight-bold p-2 border ng-scope bg-primary text-white"

    and: "Verify the first (uselected) team member has not changed the appearance"
        assert ImplementationPhaseTeamMember2.@class=="font-weight-bold p-2 border ng-scope"

    then:"The user stops, saves the partially filled proposal, log off and goes for coffee"
        ButtonSaveChanges.click()
        sleep(1000)
        waitFor{to HomePage}
        def  logoffOK=login."Logout as user"()
        assert logoffOK
        sleep(1000)

  }

def "User logs in, selects the opportunity, continues filling the proposal, saves it, and finally goes for lunch" () {
    given:" User load the Home Page"
        waitFor{to HomePage}

    and:"Logs into the system"
        SigninLink //Click already included in the definition
        //Note: because in the previous step we didn't log off GitHub, we only need to log into BCDev Exchange
        waitFor{at AuthenticationSigninPage}
        assert AuthenticationSigninPage
        waitFor{SignInButton.click()}
        sleep(2000)

    and:"Once logged, the user returns to the Opportunity page, and select the opportunity has been working on"
        //Here I am cheating a bit, but selecting a specific opp has been tested in the previous features methods
        go OppURL_global  //defined in the previous feature
        waitFor{at InitialSWUProposalPage}  //this page definition does not have a URL, as it changes with the opportunity
        sleep(2000)


    expect:"Verify the new page does NOT have the 'Start Proposal' button"
        assert !$("button",0, id:"proposaladmin.create") //Just in case...

    when: "click the 'Update my proposal' link"
        waitFor{UpdateSWUProposal.click()}
        sleep(1000)

    and: "users goes to 'Select Team' tab to update the team"
        SelectTeamTab.click()

    and: "Verify the selected user (it was the first user) in the inception phase is still selected"
        assert InceptionPhaseTeamMember1.@class=="font-weight-bold p-2 border ng-scope bg-primary text-white" //I rely in the class to verify the selected/unselected state of this element

    and: "User add the first user on the Prototype Phase list, the second one was already selected"
        PrototypePhaseTeamMember1.click()
        sleep(1000)

    and:"User moves to Pricing tab"
        PricingTab.click()

    and: "Enters the budget values for the different phases"
        BudgetInception.value(99999)
        BudgetPOC.value(299999)
        BudgetImplementation.value(599999)

    and: "Move to the Questions Tab and enter a response "
        QuestionsTab.click()
        withFrame(ProposalQuestionsBox){$("body", id:"tinymce") << "Semper vivens semperque pulcherrima rosa idea aeterna est"}

    and: "Move to the References Tab and upload a file "
        ReferencesTab.click()
        //To Be completed by uploading a file

    and: "Move to the Addenda Tab and carefully read it"
        AddendaTab.click()

    and: "Move to the Review and Submit Tab to finish the proposal"
        ReviewTab.click()

    then:" Click on the checkbox to accept the terms, Save Changes and finally go for lunch"
        assert ButtonSubmit.@disabled=="true"  //Check the Submit button is disabled
        AgreeTermsCheckBox.click()  //Agree to terms
        ButtonSubmit.click()  //Submit the proposal

}

        def teardown(){
            //Logoff as user
            waitFor{to HomePage}
            sleep(1000)  //Do not fully trust waitFor
            def  logoffOK=login."Logout as user"()
            assert logoffOK

            waitFor{to GitHubPage }
            SignOutGit.click()
        }

}



