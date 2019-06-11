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
'Hugo and friend\'s Company'.

Then users 'HibouleBlanc' and 'Hector' will request to join the company. 'HugoChibougamau', the admin for the company
will accept 'HibouleBlanc' and reject 'Hector'

The test finishes with each user logged off from BC Exchange and GitHub
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
    def "User Hugo Chibougamau creates a Company"() {
        def actions = new Actions(driver)
        
        given: "Starting from the Home Page"
            waitFor {to HomePage}

        when: "Click on the Sign In  link to go to the Authentication page"
            SigninLink.click()
            at AuthenticationSigninPage 

        and: "Click on the: 'Sign in with you GitHub account'"
            SignInButton.click()

        and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
            at GitHubSignInPage
            
            waitFor{ GitHubSignInButton }
            GitHubLogin.value("hugochibougamau")
            GitHubPwd.value("Devex_Test1")
            GitHubSignInButton.click()
            sleep(2000) // Leave time case the next page is the reauthorization page

        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded()

        then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
            at HomePage
            assert AvatarImage

        and: "Click on the Companies link to go to the orgs page"
            CompaniesNavbar.click()

        then: "Arrive at the orgs page. It should be empty"
            waitFor { at CompaniesPage }

        and: "Click on the 'Register a Company' button"
            waitFor { RegisterCompanyButton }
            RegisterCompanyButton.click()

        then: "Opens the page to create a new company" 
            waitFor { at CompaniesCreatePage }

        and: "Fill the Name of the Company, Jurisdiction, Business ID, accept the terms and continue"  
            waitFor { CompanyName }
            CompanyName.value("Hugo and friend\'s Company") 
            Jurisdiction.value("Vancouver Island and the Inlets") 
            BusinessNumber.value("BC-123456789")
            AgreeConditions.click()
            ContinueSubmitButton.click()

        then: "Arrive at the organization page. This page allows one to add extra information and accept the terms"
            waitFor { at OrgDetailsPage }

        then: "Open the pop up window that contains the name and website address"
            AddWebsite.click()

        then:"The pop up window appears. Now check the name has bee properly saved and add a web site address"
            waitFor { SaveCompanyNameBtn }
            assert CompanyLegalName.value() == "Hugo and friend\'s Company"
            CompanyWebAddress.value("www.thehs.ca")
            SaveCompanyNameBtn.click()
            sleep(1000)

        and:"Open the second edit pop-up window that allows editing more fields"
            WebElement element = driver.findElement(By.id("lblBusinessRegistration"))
            actions.moveToElement(element).build().perform()
            waitFor {EditButtonRight.click() }

        and: "First check the Registration number and Jurisdiction have been saved correctly"
            waitFor { SaveCompanyOtherInformationBtn }
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
            waitFor { AcceptButton.click() }
            sleep(1000)

        then: "Go to the Companies page and check the name of the newly created company is listed"    
            waitFor { to CompaniesPage }

            // Continually click 'Next until we get to last page of companies
            while (!NextPageLink.@disabled) {
                NextPageLink.click()
                sleep(1000)
            }
            assert waitFor { NewCompany.text() } == "Hugo and friend\'s Company" 

        and: "Log out user 'hugochibougamau' from GitHub" 
            waitFor { to GitHubPage }
            AvatarImage.click()
            waitFor { SignOutGit }
            SignOutGit.click()

        and: "Log out from BC Developers Exchange"
            waitFor { to HomePage }
            def logoffOK = login."Logout as user"()
            assert logoffOK
            sleep(3000)
    }

    @Unroll 
    def "Log as user '#Login' and join the newly created company" () {
        def actions = new Actions(driver)

        given: "Starting from the Home Page"
            waitFor { to HomePage }
            sleep(1000)

        when: "Click on the Sign In link to go to the Authentication page"
            assert SigninLink.click()
            waitFor { at AuthenticationSigninPage }

        and: "Click on the: 'Sign in with you GitHub account'"
            SignInButton.click()

        and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
            waitFor { at GitHubSignInPage }
            assert waitFor { GitHubSignInButton }
            GitHubLogin.value(Login)
            GitHubPwd.value(Pwd)
            GitHubSignInButton.click()
            sleep(2000)

        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded()

        then: "Once logged, go to Companies Page"
            waitFor { to CompaniesPage }
            sleep(1000)

        then: "Hover over the newly created company name"
            // Continually click 'Next until we get to last page of companies
            while (!NextPageLink.@disabled) {
                NextPageLink.click()
                sleep(1000)
            }

            WebElement element = driver.findElement(By.id("holderCompanyName"))
            actions.moveToElement(NewCompany.lastElement()).build().perform()
            waitFor { JoinCompanyButton.click() }
            sleep(1000)

        and: "Click Yes on the pop up confirmation window"    
            waitFor { YesButton.click() }
            sleep(1000)
    
        expect: "The label has effectively changed to Pending"  
        assert PendingLbl.text().trim() == 'Pending'

        and: "Log out user from GitHub" 
            waitFor { to GitHubPage }
            AvatarImage.click()
            waitFor { SignOutGit }
            SignOutGit.click()

        and: "Log out from BC Developers Exchange"
            waitFor { to HomePage }
            def logoffOK = login."Logout as user"()
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
            waitFor {SigninLink.click() }

        then: "Arrive at the Authenticaion page"    
            waitFor { at AuthenticationSigninPage }

        and: "Click on the: 'Sign in with you GitHub account'"
            waitFor { SignInButton.click() }

        and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
            waitFor { at GitHubSignInPage }
            waitFor { GitHubSignInButton }
            GitHubLogin.value("hugochibougamau")
            GitHubPwd.value("Devex_Test1")
            GitHubSignInButton.click()
            sleep(2000)

        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded()

        then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
            waitFor { at HomePage }
            assert AvatarImage

        and: "Click on the Messages icon. This icon should reflect there are messages waiting"
            assert UnreadMessageIcon.text().toInteger() > 0
            UnreadMessageIcon.click()
            sleep(2000)
        
        then: "Redirects to the message page"
            waitFor { at MessagesPage }

        and: "Open the drop down by clicking the top right icon"   
            AvatarImage.click()

        and: "Click on the newly created Company name that appears in the drop down"
            NewCompanyMenuItem.click()
            waitFor { at OrgDetailsPage }

        then: "It bring us to the page that defines the new company. There we click to accept for one of the users"
            waitFor { AcceptJoinRequestButtons }
            AcceptJoinRequestButtons.first().click()

        and: "Click yes to confirm in the modal box"
            ModalButtonYes.click()
            sleep(1000)
    
        and: "Wait to dissappear the modal box, and then reject the second user"
            waitFor { DeclineJoinRequestButtons }
            DeclineJoinRequestButtons.first().click() 

        and: "Click Yes to confirm the rejection in the modal box"
            ModalButtonYes.click()

        then: "Hugo can log off from BC Exchange and GitHub"    
            waitFor { to HomePage }
            def logoffOK = login."Logout as user"()
            assert logoffOK

        and: "Log out user from GitHub" 
            waitFor { to GitHubPage }
            AvatarImage.click()
            waitFor { SignOutGit }
            SignOutGit.click()
    }

    def "User Hugo Chibougamau updates the Company Info" () {
        def actions = new Actions(driver)

        given: "Starting from the Home Page"
            waitFor {to HomePage}

        when: "Click on the Sign In  link to go to the Authentication page"
            SigninLink.click()
            at AuthenticationSigninPage 

        and: "Click on the: 'Sign in with you GitHub account'"
            SignInButton.click()

        and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
            at GitHubSignInPage
            waitFor { GitHubSignInButton }
            GitHubLogin.value("hugochibougamau")
            GitHubPwd.value("Devex_Test1")
            GitHubSignInButton.click()
            sleep(2000)

        and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded()

        then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
            waitFor { at HomePage }
            assert AvatarImage

        and: "Open the drop down by clicking the top right icon"   
            AvatarImage.click()

        and: "Click on the newly created Company name that appears in the drop down"     
            NewCompanyMenuItem.click()

        then:"It bring us to the page that defines the new company. "   
            waitFor { at OrgDetailsPage }

        then: "There we click over the company info to make the edit button visible"
            BusinessRegistrationLabel.click()

        and: "After the edit button becames visible, I click on it"
            CompanyInfoEditButton.click() 

        and: "Change some values"  
            City.value("Malcom Island") 
            ContactName.value("Hugo Chibougamau")
            SaveCompanyOtherInformationBtn.click()
            sleep(2000)

        expect: "Verify the changes have took effect"
            assert PostalCodeLabel.text() == "Malcom Island V1V 2L2"
            assert BusinessContactNameLabel.text() == "Hugo Chibougamau"
    }

    def teardown(){
        waitFor { to HomePage }
        def logoffOK = login."Logout as user"()
        assert logoffOK
        waitFor { to GitHubPage }
        SignOutGit.click()
    }
}
