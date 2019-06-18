import geb.spock.GebReportingSpec
import geb.*

import pages.app.HomePage
import pages.app.AuthenticationSigninPage 
import pages.app.CompaniesPage
import pages.app.GitHubPage
import pages.app.GitHubSignInPage
import pages.app.OpportunitiesPage

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title
import spock.lang.Stepwise

import org.openqa.selenium.Keys
import org.openqa.selenium.WebElement
import org.openqa.selenium.By
import org.openqa.selenium.interactions.Actions

@Stepwise

@Narrative('''In this test, the already existing user 'HugoChibougamau' will delete one SWU proposal and then
will delete a CWU proposal -created by the user in previous tests- 
After that, the user will delete 'Hugo's Company and friends', an already existing company, also create by the user.
 ''')

@Title("User deletes an existing SWU proposal and then deletes a Company")
class UserDeletesProposal_Company extends GebReportingSpec {         

  def "User Hugo Chibougamau deletes a SWU proposal" () {
   
    given: "Starting from the Home Page"
        waitFor {to HomePage}

    when: "Click on the Sign In  link to go to the Authentication page"
        SigninLink //The definition for this element includes a Click
        at AuthenticationSigninPage 

    and: "Click on the: 'Sign in with you GitHub account'"
        SignInButton.click()

    and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
        at GitHubSignInPage
        
        waitFor{GitHubSignInButton} //If this element is present the page has loaded
		GitHubLogin.value("hugochibougamau")
		GitHubPwd.value("Devex_Test1")
        GitHubSignInButton.click()
        sleep(1000)

    then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
        waitFor{at HomePage} //verify we are in the home page
        assert AvatarImage  //Verify the avatar image is present. In the future I may check the image itself is the correct one

    and: "Click on the Opportunities link to go to the opportunities page"
        OpportunitiesNavBar //this reference already includes a click

    then: "Arrive at the opportunities page."
        waitFor{at OpportunitiesPage}
        sleep(1000)

    when: "User clicks again on the first opportunity of the list (we assume is the one the previously used to present a proposal"
        waitFor{ TestSWUOpportunities }
        def OppTitle = TestSWUOpportunities[0].text()  //Opportunity title
        def MyCurrentURL=getCurrentUrl() //URL opportunity page
        //The following is to create from the opp title the URL
        def OppURL= MyCurrentURL + "/swu/opp-" + OppTitle.replaceAll(' ','-').replaceAll(':','-').toLowerCase()

        TestSWUOpportunities[0].click()  //Same opportunity as before
        sleep(1000)
        def NewURL=getCurrentUrl() //This is the specific opportunity URL

    then: "User arrives to the selected opportunity URL"
        assert NewURL==OppURL  //OppURL was defined before. This step is a bit paranoid, and may be deleted

    when: "Click on 'Update my Proposal' link"
        waitFor{$("a",id:"proposaladmin.edit",0).click()} //there may be two locations where this link appears

    and:" We move to the Proposal Edit Page and click on the 'Delete this Proposal' -in the shape of a garbage bin-"
        waitFor{$("button",'data-automation-id':"btnDeleteSWUProposal").click()}

    then: "A modal window appears. Click on the Yes button"    
        waitFor{$("button",'data-automation-id':"button-modal-yes").click()}

    expect:"Returns to the same opportunity page, but this time showing the 'Star a Proposal' button "
        assert waitFor{$("button",id:"proposaladmin.create")}

    }


  def "User Hugo Chibougamau deletes a CWU proposal" () {
   
    given: "Starting from the Home Page"
        //User already logged
        waitFor {to HomePage}
        assert AvatarImage  //Verify the avatar image is present, it indicates user is logged

    and: "Click on the Opportunities link to go to the opportunities page"
        OpportunitiesNavBar //this reference already includes a click

    when: "Arrive at the opportunities page."
        waitFor{at OpportunitiesPage}
        sleep(1000)

    and: "User clicks again on the first opportunity of the list (we assume is the one the previously used to present a proposal"
        waitFor{ TestCWUOpportunities }
        def OppTitle = TestCWUOpportunities[0].text()  //Opportunity title
        def MyCurrentURL=getCurrentUrl() //URL opportunity page
        //The following is to create from the opp title the URL
        def OppURL= MyCurrentURL + "/cwu/opp-" + OppTitle.replaceAll(' ','-').replaceAll(':','-').toLowerCase()

        TestCWUOpportunities[0].click()  //Same opportunity as before
        sleep(1000)
        def NewURL=getCurrentUrl() //This is the specific opportunity URL

    then: "User arrives to the selected opportunity URL"
        assert NewURL==OppURL  //OppURL was defined before. This step is a bit paranoid, and may be deleted

    when: "Click on 'Update my Proposal' link"
        waitFor{$("a",id:"proposaladmin.edit",0).click()} //there may be two locations where this link appears

    and:" We move to the Proposal Edit Page and click on the 'Delete this Proposal' -in the shape of a garbage bin-"
        waitFor{$("button",'data-automation-id':"button-cwu-proposal-delete").click()}

    then: "A modal window appears. Click on the Yes button"    
        waitFor{$("button",'data-automation-id':"button-modal-yes").click()}

    expect:"Returns to the same opportunity page, but this time showing the 'Star a Proposal' button "
        assert waitFor{$("button",id:"proposaladmin.create")}

    }


def "User Hugo Chibougamau deletes a company" () {
    //User already logged
    def actions = new Actions(driver)  
    
    given: "Starting from the Home Page"
        waitFor {to HomePage}

    and: "Click on the Companies link to go to the Companies page"
        CompaniesNavbar //this reference already includes a click

    when: "Arrive at the companies page."
        waitFor{at CompaniesPage}
        sleep(1000)

    then: "Hover over the company name to make the gear icon appear"
        WebElement element = driver.findElement(By.id("holderCompanyName"))//These two lines move the cursor over one of the labels to make the Edit button visible
        actions.moveToElement(element).build().perform()//Hovering over makes the gear/Admin button visible

    and: "Clicks on the Admin gear to edit the company"
        waitFor{$("button",'data-automation-id':"btnOrgAdmin" ,0).click()} //Just in case there are more than one company listed
        sleep(1000) //to give time to the pop up window to appear

    then:" Redirected to the page that displays the compoany information, we click on the 'Delete Company Profile' button"
        waitFor{$("button",'data-automation-id':"btnDelete").click()} 

    then: "A modal window appears. Click on the Yes button"    
        waitFor{$("button",'data-automation-id':"button-modal-yes").click()}

    expect:"Returns to the same Company page"
        assert waitFor{at CompaniesPage}

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

