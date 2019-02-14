import geb.spock.GebReportingSpec
import geb.*

import pages.app.HomePage
import pages.app.AuthenticationSigninPage 
import pages.app.CompaniesPage
import pages.app.CompaniesCreatePage 
import pages.app.CompaniesCreateDetailsPage
import pages.app.GitHubPage
import pages.app.GitHubSignInPage
import pages.app.MessagesPage

import pages.app.OrgDetailsPage

import geb.module.RadioButtons

import org.openqa.selenium.By
import org.openqa.selenium.Keys
import org.openqa.selenium.interactions.Actions
import org.openqa.selenium.WebElement
//import extensions.AngularJSAware

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title
import spock.lang.Stepwise

import java.io.File
import java.io.IOException



@Stepwise


@Narrative('''In this test, the already existing user 'HugoChibougamau' will create a company named 
'Hugo's Company'.

Then users 'HibouleBlanc' and 'Hector' will request to join the company. 

The test finish with each user logged off from BC Exchange and GitHub
 ''')

@Title("User creates a Company")
class UserCreatesCompany extends GebReportingSpec {         

            def CompareFileContents() {

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


  def "User Hugo Chibougamau creates a Company" () {
    def actions = new Actions(driver)
    
    given: "Starting from the Home Page"
        waitFor {to HomePage}

    when: "Click on the Sign In  link to go to the Authentication page"
        SigninLink //The definition for this element includes a Click
        at AuthenticationSigninPage 

    and: "Click on the: 'Sign in with you GitHub account'"
        SingInButton.click()

    and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
        at GitHubSignInPage
        
        waitFor{GitHubSignInButton} //If this element is present the page has loaded
		GitHubLogin.value("hugochibougamau")
		GitHubPwd.value("Devex_Test1")
        GitHubSignInButton.click()

    then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
        at HomePage //verify we are in the home page
        assert AvatarImage  //Verify the avatar image is present. In the future I may check the image itself is the correct one

    and: "Click on the Companies link to go to the orgs page"
        CompaniesNavbar //this reference already includes a click

    then: "Arrive at the orgs page. It should be empty"
        waitFor{at CompaniesPage}

    and: "Click on the 'Register a Company' button"
        waitFor{RegisterCompanyButton}
        RegisterCompanyButton.click()

    then: "Opens the page to create a new company" 
        waitFor{at CompaniesCreatePage}

    and: "Fill the Name of the Company, Jurisdiction, Business ID, accept the terms and continue"  
        waitFor{CompanyName}
        CompanyName.value("Hugo and friend\'s Company") 
        Jurisdiction.value("Vancouver Island and the Inlets") 
        BusinessNumber.value("BC-123456789")
        AgreeConditions.click() // When all the fields are completed the next button should be enabled
        ContinueSubmitButton.click()
        sleep(2000) //There is an angular animation and I prefer is gone before proceeding

    then: "Arribe to the organization page. This page allows to add extra information and accept the terms"
        waitFor{at OrgDetailsPage}

    then: "Open the pop up window that contains the name and website address"
        AddWebsite.click()  //Clicking here makes the next window pop up

    then:"The pop up window appears. Now check the name has bee properly saved and add a web site address"
        waitFor{SaveCompanyNameBtn} //Made sure the pop up window is fully loaded, as the URL is not fixed
        assert CompanyLegalName.value()=="Hugo and friend\'s Company" //check the previously added name has been correctly saved
        CompanyWebAddress.value("www.thehs.ca") //adding the web site address
        SaveCompanyNameBtn.click()
        sleep(1000)

    and:"Open the second edit pop-up window that allows editing more fields"
        WebElement element = driver.findElement(By.id("lblBusinessRegistration"))//These two lines move the cursor over one of the labels to make the Edit button visible
        actions.moveToElement(element).build().perform()
        waitFor{EditButtonRight.click()}

    and: "First check the Registration number and Jurisdiction have been saved correctly"
        waitFor{SaveCompanyOtherInformationBtn}
        assert BusinessNumber.value()=="BC-123456789"
        assert Jurisdiction.value()=="Vancouver Island and the Inlets"

    and: "Finish entering all the company information"
        Address1.value("Upper Ganges Road 123")
        Address2.value("corner with Spark Road")
        City.value("Salt Spring Island")
        Province.value("British Columbia")
        PostalCode.value("V1V 2L2")

        ContactName.value("Hugo Chibougmaiu")
        ContactPhone.value("250 200 1234")
        ContactEmail.value("hugo@fakeaddress.ca")

        SaveCompanyOtherInformationBtn.click()

    and:" Accept the terms to finish creating the company"
        waitFor{AcceptButton.click()}  //Accept the terms
        sleep(2000)//Give time to the message to appear and dissappear

    then: "Go to the Companies page and check the name of the newly created company is listed"    
        waitFor{to CompaniesPage}
        //sleep(1000) //despite all the WaitFor, I need this delay
        assert waitFor{NewCompany.text()}=="Hugo and friend\'s Company" 

    and: "Log out user 'hugochibougamau' from GitHub" 
        waitFor{to GitHubPage}
        AvatarImage.click()
        waitFor{SignOutGit}
        SignOutGit.click()

    and: "Log out from BC Developers Exchange"
        waitFor{to HomePage}
        def  logoffOK=login."Logout as user"()
        assert logoffOK
        sleep(3000)

    }

@Unroll 
def "Log as user '#Login' and join the newly created company" () {
    def actions = new Actions(driver)

    given: "Starting from the Home Page"
        waitFor {to HomePage}
        sleep(1000)

    when: "Click on the Sign In  link to go to the Authentication page"
        assert SigninLink //The definition for this element includes a Click
        waitFor{at AuthenticationSigninPage}

    and: "Click on the: 'Sign in with you GitHub account'"
        SingInButton.click()

    and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
        waitFor{at GitHubSignInPage}
        
        waitFor{GitHubSignInButton} //If this element is present the page has loaded
		GitHubLogin.value(Login)
		GitHubPwd.value(Pwd)
        GitHubSignInButton.click()

    then: "Once logged, go to Companies Page"
        waitFor {to CompaniesPage}
        sleep(1000)

    then: "Hover over the newly created company name"
        WebElement element = driver.findElement(By.id("holderCompanyName"))//These two lines move the cursor over one of the labels to make the Edit button visible
        actions.moveToElement(element).build().perform()//Hovering over makes the Join button visible
        waitFor{JoinCompanyButton.click()}
        sleep(1000) //to give time to the pop up window to appear

    and: "Click Yes on the pop up confirmation window"    
        waitFor{YesButton.click()}
        sleep(1000) //to give time to the pop up window to disappear
 
    expect: "The label has effectively changed to Pending"  
       assert  PendingLbl.text().trim()=='Pending'

    and: "Log out user 'Login' from GitHub" 
        waitFor{to GitHubPage}
        AvatarImage.click()
        waitFor{SignOutGit}
        SignOutGit.click()

    and: "Log out from BC Developers Exchange"
        waitFor{to HomePage}
        def  logoffOK=login."Logout as user"()
        assert logoffOK
   
    
    where: "The values used to create the Opportunity are:"
        Login | Pwd 
        "hibouleblanc"|"Devex_Test1" 
        "hectorcunniculus"|"Devex_Test1"  

  }

def "User Hugo, logs again and accept the request to join the Company from the two previous users" () {
    given: "Starting from the Home Page"
        waitFor {to HomePage}

    when: "Click on the Sign In  link to go to the Authentication page"
        waitFor{SigninLink} //The definition for this element includes a Click

    then: "Arrive at the Authenticaion page"    
        waitFor{at AuthenticationSigninPage}

    and: "Click on the: 'Sign in with you GitHub account'"
        waitFor{SingInButton.click()}

    and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
        waitFor{at GitHubSignInPage}
        
        waitFor{GitHubSignInButton} //If this element is present the page has loaded
		GitHubLogin.value("hugochibougamau")
		GitHubPwd.value("Devex_Test1")
        GitHubSignInButton.click()



    then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
        waitFor{at HomePage} //verify we are in the home page
        sleep(3000) //The icons take a little time to appear
        assert AvatarImage  //Verify the avatar image is present. In the future I may check the image is correct

    and: "Click on the Messages icon. This icon should reflect there are messages waiting"
        assert UnreadMessageIcon.text().toInteger()>0
        println("# Messages --->"+UnreadMessageIcon.text() )
        UnreadMessageIcon.click()
        sleep(2000)
    

    then: "Redirects to the message page"
         println("Line 272 (Message Page)  ${driver.currentUrl}"  )
         waitFor{at MessagesPage}
        println("Line 274 (Message Page)  ${driver.currentUrl}"  )

    and: "Click to accept the user request to join the company"
        sleep(5000)
        //ProcessUserRequest.click()
        //$(('a[href ~= "http://localhost:3000/orgs/"]'), 0).click()
        $(By.xpath('//*[@id="page-top"]/main/div/div/div[3]/section/div/message-list/div[1]/div/div[2]/p/p[3]/a'),0).click()
   

    then: "It bring us to the page that defines the new company. There we click to accept for one of the users"
        waitFor{$("button",'data-automation-id':"btnAcceptMember",0)}
        $("button",'data-automation-id':"btnAcceptMember",0).click() //Accept the first user

    and: "Click yes to confirm in the modal box"
        $("button",'data-automation-id':"button-modal-yes").click()
        sleep(2000)
   
    and: "Wait to dissappear the modal box, and then reject the second user"
        waitFor{$("button",'data-automation-id':"btnDeclineMember",0)}//After accepting the previous user, it dissappears, so the 'second' user in the list becames 'first'
        $("button",'data-automation-id':"btnDeclineMember",0).click() //Reject the second user

        sleep(1000)

    and: "Click No to confirm the rejection in the modal box"
        $("button",'data-automation-id':"button-modal-no").click()
        sleep(2000)

    then: "Hugo can log off from BC Exchange and GitHub"    
        waitFor{to HomePage}
        def  logoffOK=login."Logout as user"()
        assert logoffOK

    and: "Log out user from GitHub" 
        waitFor{to GitHubPage}
        AvatarImage.click()
        waitFor{SignOutGit}
        SignOutGit.click()


  }


        def cleanup(){
            js.exec('window.scrollTo(0, document.body.scrollHeight);')
            sleep(5000)
         //   DeleteButton.click()
         //   $("button",'data-automation-id':"button-modal-yes").click()
        }

}

