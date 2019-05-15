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

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title
import spock.lang.Stepwise
import spock.lang.IgnoreIf

import java.io.File
import java.io.IOException

@Stepwise


@Narrative('''In this test, the already existing user 'HugoChibougamau' will create a company named 
'Hugo's Company'.

Then users 'HibouleBlanc' and 'Hector' will request to join the company. 'HugoChibougamau', the admin for the company
will accept 'HibouleBlanc' and reject 'Hector'

The test finish with each user logged off from BC Exchange and GitHub
 ''')

@Title("User creates a Company")
class UserCreatesCompany extends GebReportingSpec {

    def Boolean CheckIfReauthIsNeeded(){
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

    @Unroll
    def "User Hugo Chibougamau creates a Company" () {
        def actions = new Actions(driver)
        
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
            sleep(2000) //Leave time case the next page is the reauthorization page

        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

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
            sleep(1000) //There is an angular animation and I prefer is gone before proceeding

        then: "Arribe to the organization page. This page allows to add extra information and accept the terms"
            waitFor{at OrgDetailsPage}

        then: "Open the pop up window that contains the name and website address"
            AddWebsite.click()  //Clicking here makes the next window pop up

        then:"The pop up window appears. Now check the name has bee properly saved and add a web site address"
            waitFor{SaveCompanyNameBtn} //Made sure the pop up window is fully loaded, as the URL is not fixed
            assert CompanyLegalName.value()=="Hugo and friend\'s Company" //check the previously added name has been correctly saved
            CompanyWebAddress.value("www.thehs.ca") //adding the web site address
            SaveCompanyNameBtn.click()
            sleep(1000) //the WaitFor does not work well for the next instructions

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

            ContactName.value("Hugo Chibougmaiu")  //spelling mistake to be corrected later
            ContactPhone.value("250 200 1234")
            ContactEmail.value("hugo@fakeaddress.ca")

            SaveCompanyOtherInformationBtn.click()

        and:" Accept the terms to finish creating the company"
            waitFor{AcceptButton.click()}  //Accept the terms
            sleep(1000)//Give time to the message to appear and dissappear

        then: "Go to the Companies page and check the name of the newly created company is listed"    
            waitFor{to CompaniesPage}
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
            SignInButton.click()

        and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
            waitFor{at GitHubSignInPage}   
            assert waitFor{GitHubSignInButton} //If this element is present the page has loaded
            GitHubLogin.value(Login)
            GitHubPwd.value(Pwd)
            GitHubSignInButton.click()
            sleep(2000) //Leave time case the next page is the reauthorization page

        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

        then: "Once logged, go to Companies Page"
            waitFor {to CompaniesPage}
            sleep(1000)//Next lines of code need this delay

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
    
        where: "The values to create the Users are:"
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
            waitFor{SignInButton.click()}

        and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
            waitFor{at GitHubSignInPage}
            
            waitFor{GitHubSignInButton} //If this element is present the page has loaded
            GitHubLogin.value("hugochibougamau")
            GitHubPwd.value("Devex_Test1")
            GitHubSignInButton.click()
            sleep(2000) //Leave time case the next page is the reauthorization page

        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

        then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
            waitFor{at HomePage} //verify we are in the home page
            sleep(3000) //The icons take a little time to appear
            assert AvatarImage  //Verify the avatar image is present. In the future I may check the image is correct

        and: "Click on the Messages icon. This icon should reflect there are messages waiting"
            assert UnreadMessageIcon.text().toInteger()>0
            UnreadMessageIcon.click()
            sleep(2000) // Do not trust the waitFor
        
        then: "Redirects to the message page"
            waitFor{at MessagesPage}

        and: "Open the drop down by clicking the top right icon"   
            AvatarImage.click()

        and: "Click on the newly created Company name that appears in the drop down"     
            waitFor{$("a", text: contains("Hugo and friend\'s Company")).click()}

        then: "It bring us to the page that defines the new company. There we click to accept for one of the users"
            waitFor{$("button",'data-automation-id':"btnAcceptMember",0)}
            $("button",'data-automation-id':"btnAcceptMember",0).click() //Accept the first user

        and: "Click yes to confirm in the modal box"
            $("button",'data-automation-id':"button-modal-yes").click()
            sleep(1000) //For the modal box to dissappear
    
        and: "Wait to dissappear the modal box, and then reject the second user"
            waitFor{$("button",'data-automation-id':"btnDeclineMember",0)}//After accepting the previous user, it dissappears, so the 'second' user in the list becames 'first'
            $("button",'data-automation-id':"btnDeclineMember",0).click() //Reject the second user
            sleep(1000)  //For the modal box to dissappear

        and: "Click No to confirm the rejection in the modal box"
            $("button",'data-automation-id':"button-modal-no").click()
            sleep(1000)  //For the modal box to dissappear

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

    def "User Hugo Chibougamau updates the Company Info" () {
        def actions = new Actions(driver)

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
            sleep(2000) //Leave time case the next page is the reauthorization page


        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

        then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
            waitFor{at HomePage} //verify we are in the home page
            sleep(3000) //The icons take a little time to appear
            assert AvatarImage  //Verify the avatar image is present. In the future I may check the image is correct

        and: "Open the drop down by clicking the top right icon"   
            AvatarImage.click()

        and: "Click on the newly created Company name that appears in the drop down"     
            waitFor{$("a", text: contains("Hugo and friend\'s Company")).click()}

        then:"It bring us to the page that defines the new company. "   
            waitFor{at OrgDetailsPage}

        then: "There we click over the company info to make the edit button visible"
            waitFor{$('data-automation-id':"lblBusinessRegistration" )}//I use this element because I already had wrote a label for it
            $('data-automation-id':"lblBusinessRegistration" ).click()
            sleep(1000)

        and: "After the edit button becames visible, I click on it"
            $("button",'data-automation-id':"btnEdit_right" ).click() 
            sleep(1000)

        and: "Change some values"  
            City.value("Malcom Island") 
            ContactName.value("Hugo Chibougamau")  //Correcting the spelling mistake
            SaveCompanyOtherInformationBtn.click()
            sleep(1000) //There is an angular animation and I prefer is gone before proceeding

        expect: "Verify the changes have took effect"
            assert  $("div",'data-automation-id':"lblBusinessCityPostalCode" ).text()=="Malcom Island V1V 2L2"
            assert  $("div",'data-automation-id':"lblBusinessContactName"  ).text()=="Hugo Chibougamau"
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

