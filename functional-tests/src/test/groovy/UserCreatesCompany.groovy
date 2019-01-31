import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.AuthenticationSigninPage 
import pages.app.CompaniesPage
import pages.app.CompaniesCreatePage 
import pages.app.CompaniesCreateDetailsPage
import pages.app.GitHubPage
import pages.app.GitHubSignInPage
import pages.app.MessagesPage

import geb.module.RadioButtons

import org.openqa.selenium.By
import org.openqa.selenium.Keys
//import extensions.AngularJSAware

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title
import spock.lang.Stepwise


@Stepwise


@Narrative('''In this test, the already existing user 'HugoChibougamau' will create a company named 
'Hugo's Company' and then will invite users 'HibouleBlanc' and 'Hector' to join. 

The users then will log into the site and accept the invitation

The test finish with each user logged off from BC Exchange and GitHub
 ''')

@Title("User creates a Company")
class UserCreatesCompany extends GebReportingSpec {

          def CompareFileContents() {
           //if(f1.length()!=f2.length())return false

            //reportInfo("User directory is:" + System.getProperty('user.home') )
            File FilePath1=new File(System.getProperty('user.home')+"/Downloads/rfq-sprint-with-us-company.pdf")
            File FilePath2=new File(System.getProperty('user.home')+"/Feina/Contractes/BCDEVEX/devex/functional-tests/src/test/resources/rfq-sprint-with-us-company.pdf")

            FileInputStream fis1 = new FileInputStream(FilePath1)
            FileInputStream fis2 = new FileInputStream(FilePath2)
            try {
                int byte1
                while((byte1 = fis1.read())!=-1) {
                    int byte2 = fis2.read()
                    if(byte1!=byte2)return false
                }
            } finally {
                fis1.close()
                fis2.close()
                //Delete the just downloaded file. Useful when running lots of test one after the other
                //The FileInputStream class does not have a delete method, so I need to use another class
                def ftd=new File(System.getProperty('user.home')+"/Downloads/rfq-sprint-with-us-company.pdf")
                ftd.delete()
            }

            return true
      }


  def "Go to Home Page and click on the log to GitHub button as user Hugo Chibougamau" () {
    given: "Starting from the Home Page"
        waitFor {to HomePage}

    when: "Click on the Sign In  link to go to the Authentication page"
        SigninLink //The definition for this element includes a Click
        at AuthenticationSigninPage 
        println("Line 45  ${driver.currentUrl}"  )

    and: "Click on the: 'Sign in with you GitHub account'"
        SingInButton.click()
        println("Line 48  ${driver.currentUrl}"  )

    and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
        at GitHubSignInPage
        println("Line 53  ${driver.currentUrl}"  )
        
        waitFor{GitHubSignInButton} //If this element is present the page has loaded
		GitHubLogin.value("hugochibougamau")
		GitHubPwd.value("Devex_Test1")
        GitHubSignInButton.click()

    then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
        at HomePage //verify we are in the home page
        assert AvatarImage  //Verify the avatar image is present. In the future I may check the image is correct

    and: "Click on the Companies link to go to the orgs page"
        CompaniesNavbar //this reference already includes a click

    then: "Arrive at the orgs page. It should be empty"
        at CompaniesPage
        println("Line 69 (Company Page)  ${driver.currentUrl}"  )

    and: "Click on the 'Register a Company' button"
        
        waitFor{RegisterCompanyButton}
        RegisterCompanyButton.click()

        //$("button",'data-automation-id':"button-register-a-company").click()

    then: "Opens the page to create a new company" 
        at CompaniesCreatePage 
        println("Line 76 (Company Create Page)   ${driver.currentUrl}"  )

    and: "Fill the Name of the Company, Jurisdiction, Business ID, accept the terms and continue"  
        waitFor{CompanyName}
        CompanyName.value("Hugo and friend\'s Company") 
        Jurisdiction.value("Vancouver Island and the Inlets") 
        BusinessNumber.value("BC-123456789")
        AgreeConditions.click() // When all the fields are completed the next button should be enabled
        ContinueSubmitButton.click()
        sleep(2000) //There is an angular animation and I prefer is gone before proceeding

    then: "A new page appears. In this section we verify the field that have already been enter"
        at CompaniesCreateDetailsPage
        waitFor{SaveCompanyButton} //Made sure the page is fully loaded, as the URL is not fixed
        assert CompanyLegalName.value()=="Hugo and friend\'s Company"
        assert BusinessNumber.value()=="BC-123456789"
        assert Jurisdiction.value()=="Vancouver Island and the Inlets"        

    and:"And in this one we enter values for the new requested fields" 
        DoingBusinessAs.value("United H\'s")
        Address1.value("Upper Ganges Road 123")
        Address2.value("corner with Spark Road")
        City.value("Salt Spring Island")
        Province.value("British Columbia")
        PostalCode.value("V1V 2L2")

        WebAddress.value("www.thehs.ca")

        ContactName.value("Hugo Chibougmaiu")
        ContactPhone.value("250 200 1234")
        ContactEmail.value("hugo@fakeaddress.ca")

    and:"Click on the TeamMembersTab to invite team members"
        TeamMembersTab.click()

    and: "Send email to team members"
        InviteTeamMembers.value("hibouleblanc@fakeaddress.ca,hectorcunniculus@fakeaddress.ca")
        BtnSendInvitations.click()
        waitFor{BtnAckInvitationsSent}//This is a modal window and takes some time to appear
        BtnAckInvitationsSent.click() //Ack the invitations have been sent
        sleep(1000) //The previus step is in a modal window, and it needs to be gone before proceeding

    then:"Go to the Terms tab"


        println("is TermsTab displayed: ${TermsTab.isDisplayed()} " )
        TermsTab.click()

    and: "Download the RFQ Document and check it matches the copy stored in this test"
        LnkTermRFQ1.click()
        sleep(2000) //Let's give some time for the document to download

    then: "I check the downloaded document matches the one stored in this system"
        def  ComparisonOK = CompareFileContents()
        assert ComparisonOK

    and:" Accept the term conditions "
        CkbAckTermsCompany.click()

    and:"Finally save the newly created company"
        SaveCompanyButton.click()
        sleep(2000) //There is an angular animation and I prefer is gone before proceeding
sleep(5000)

    and: "Log out user '#UserFirstName' from BC Exchange"
        waitFor{to HomePage}
        def  logoffOK=login."Logout as user"()
        assert logoffOK

    and: "Log out user from GitHub" 
        waitFor{to GitHubPage}
        AvatarImage.click()
        waitFor{SignOutGit}
        SignOutGit.click()

    }
}

@Title("User accept Invitations")
class UsersAcceptInvitations extends GebReportingSpec {

 @Unroll
  def "The two users invited to join the company accept the invitation" () {
      given: "Starting from the Home Page"
        waitFor {to HomePage}

    when: "Click on the Sign In  link to go to the Authentication page"
        SigninLink //The definition for this element includes a Click
        at AuthenticationSigninPage 
        println("Line 194  ${driver.currentUrl}"  )

    and: "Click on the: 'Sign in with you GitHub account'"
        SingInButton.click()
        println("Line 198  ${driver.currentUrl}"  )

    and: "Arrive to the GitHub login page, where we will be able to log using the credentials '#Login' and '#Pwd'"
        at GitHubSignInPage
        println("Line202  ${driver.currentUrl}"  )
        
        waitFor{GitHubSignInButton} //If this element is present the page has loaded
		GitHubLogin.value(Login)
		GitHubPwd.value(Pwd)
        GitHubSignInButton.click()

    then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
        at HomePage //verify we are in the home page
        assert AvatarImage  //Verify the avatar image is present. In the future I may check the image is correct

    and: "Click on the Messages icon. This icon should reflect there are messages waiting"
        UnreadMessageIcon.click()
    

    then: "Redirects to the message page"
         println("Line 222 (Message Page)  ${driver.currentUrl}"  )
         waitFor{at MessagesPage}
        println("Line 224 (Message Page)  ${driver.currentUrl}"  )

    and: "Click to accept the invitation"
        sleep(1000)
        BtnAccept.click()

    then: "#UserFirstName can log off from BC Exchange and GitHub"    
        waitFor{to HomePage}
        def  logoffOK=login."Logout as user"()
        assert logoffOK

    and: "Log out user from GitHub" 
        waitFor{to GitHubPage}
        AvatarImage.click()
        waitFor{SignOutGit}
        SignOutGit.click()

         where: "The values used to create the Opportunity are:"
        Login | Pwd | UserFirstName | UserLastName | UserEmail | UserCity 
       // "hibouleblanc"|"Devex_Test1" |"Hibou" |"Leblanc"|"hibouleblanc@fakeaddress.ca"|"Victoria"
        "hectorcunniculus"|"Devex_Test1" |"Hector" |""|"hectorcunniculus@fakeaddress.ca"|"Duncan"


  }

}
