import geb.spock.GebReportingSpec
import geb.*

import pages.app.HomePage
import pages.app.AuthenticationSigninPage
import pages.app.AuthenticationSigninadminPage 
import pages.app.CompaniesPage
import pages.app.CompaniesCreatePage 
import pages.app.CompaniesCreateDetailsPage
import pages.app.GitHubPage
import pages.app.GitHubSignInPage
import pages.app.MessagesPage
import pages.app.OrgDetailsPage

import specs.traits.Utils

import geb.module.RadioButtons

import org.openqa.selenium.By
import org.openqa.selenium.Keys
import org.openqa.selenium.interactions.Actions
import org.openqa.selenium.WebElement

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title
import spock.lang.Stepwise

import java.io.File
import java.io.IOException

@Stepwise

@Title('Dev Exchange Company Tests')
@Narrative('''As a user, I want to create, update, and delete a company, and add and remove company members.''')
class CompanySpecs extends GebReportingSpec {      

    // Add setup() method?
    def setup() {
        given: 'I have navigated to the Home Page'
            to HomePage
            // TODO:  Fix the error re "Cannot read property 'scrollIntoView' of null" for SigninadminLink
        and: 'I enter my admin user credentials and sign in as an admin user'    
            SigninadminLink
            waitFor {at AuthenticationSigninadminPage}
            Username.value("user")
            Password.value("useruser") 
        when: 'I click the SignIn button'    
            SignInButton.click()
        then: 'I am signed into the application'  
            at HomePage  
            assert AvatarImage  //Verify the avatar image is present. In the future I may check the image itself is the correct one        
    }

    // Create company
    // createCompany (Map user)
    
  def "Creating a New Company" () {
    def actions = new Actions(driver)
    
    given: 'I have navigated to the Home page' 
      
    and: "I click on the Companies link to navigate to the orgs page"
        CompaniesNavbar //this reference already includes a click
        waitFor{at CompaniesPage}
        waitFor{RegisterCompanyButton}
        
    and: "I click on the 'Register a Company' button"
        RegisterCompanyButton.click()
        waitFor{at CompaniesCreatePage}
        waitFor{CompanyName}

    and: "I enter information for the required fields and accept the terms and conditions"  
        CompanyName.value(companyName) 
        Jurisdiction.value(jurisdiction) 
        BusinessNumber.value(businessNumber)
        AgreeConditions.click() // When all the fields are completed the next button should be enabled
        assert ContinueSubmitButton
    
    and: "I click on the Submit button"
        ContinueSubmitButton.click()
        sleep(1000) //There is an angular animation and I prefer is gone before proceeding
        waitFor{at OrgDetailsPage}

    and: "I open the pop up window that contains the name and website address"
        AddWebsite.click()  //Clicking here makes the next window pop up
        waitFor{SaveCompanyNameBtn} //Made sure the pop up window is fully loaded, as the URL is not fixed
        assert CompanyLegalName.value()==companyName //check the previously added name has been correctly saved

    and: "I enter additonal (and optional) information about the company."        
        CompanyWebAddress.value("www.thehs.ca") //adding the web site address
        SaveCompanyNameBtn.click()
        sleep(1000) //the WaitFor does not work well for the next instructions

    and:"I open the second modal that allows me access to additional fields"
        WebElement element = driver.findElement(By.id("lblBusinessRegistration"))//These two lines move the cursor over one of the labels to make the Edit button visible
        actions.moveToElement(element).build().perform()
        waitFor{EditButtonRight.click()}
        waitFor{SaveCompanyOtherInformationBtn}

    and: "I confirm that the Registration number and Jurisdiction have been saved correctly"       
        assert BusinessNumber.value()==businessNumber
        assert Jurisdiction.value()==jurisdiction

    and: "I enter additional information about the company"
        Address1.value(address1)
        Address2.value(address2)
        City.value(city)
        Province.value(province)
        PostalCode.value(postalCode)
        ContactName.value(contactName)  //spelling mistake to be corrected later
        ContactPhone.value(contactPhone)
        ContactEmail.value(contactEmail)
        SaveCompanyOtherInformationBtn.click()

    when:"I click on the Accept button to complete the creation of my new company"
        waitFor{AcceptButton.click()}  //Accept the terms
        sleep(1000)//Give time to the message to appear and dissappear

    then: "I navigate to the Companies page to confirm that the list of companies includes my new company"    
        waitFor {to CompaniesPage}
        waitFor {CompanySearchTextbox.value(companyName)}
        assert CompanyTable.$('tbody tr').size()>0

    and: "Log out from BC Developers Exchange"
        waitFor{to HomePage}
        def  logoffOK=login."Logout as user"()
        assert logoffOK
        sleep(3000)
    where:
        companyName | jurisdiction | businessNumber | address1 | address2 | city | province | postalCode | contactName | contactPhone | contactEmail
        "DevEx Company" | "BC" | "123456789" | "Main Street" | "Apt. #1" | "Victoria" | "BC" | "V1A B2C" | "Joe Smith" | "250.123.4567" | "joe@joe.com"
    }

// @Unroll 
// def "Log as user '#Login' and join the newly created company" () {
//     def actions = new Actions(driver)

//     given: "Starting from the Home Page"
//         waitFor {to HomePage}
//         sleep(1000)

//     when: "Click on the Sign In  link to go to the Authentication page"
//         assert SigninLink //The definition for this element includes a Click
//         waitFor{at AuthenticationSigninPage}

//     and: "Click on the: 'Sign in with you GitHub account'"
//         SignInButton.click()

//     and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
//         waitFor{at GitHubSignInPage}   
//         assert waitFor{GitHubSignInButton} //If this element is present the page has loaded
// 		GitHubLogin.value(Login)
// 		GitHubPwd.value(Pwd)
//         GitHubSignInButton.click()
//         sleep(2000) //Leave time case the next page is the reauthorization page

//     and:"If redirected to the reauthorization page, click to reauthorize"    
//         assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

//     then: "Once logged, go to Companies Page"
//         waitFor {to CompaniesPage}
//         sleep(1000)//Next lines of code need this delay

//     then: "Hover over the newly created company name"
//         WebElement element = driver.findElement(By.id("holderCompanyName"))//These two lines move the cursor over one of the labels to make the Edit button visible
//         actions.moveToElement(element).build().perform()//Hovering over makes the Join button visible
//         waitFor{JoinCompanyButton.click()}
//         sleep(1000) //to give time to the pop up window to appear

//     and: "Click Yes on the pop up confirmation window"    
//         waitFor{YesButton.click()}
//         sleep(1000) //to give time to the pop up window to disappear
 
//     expect: "The label has effectively changed to Pending"  
//        assert  PendingLbl.text().trim()=='Pending'

//     and: "Log out user 'Login' from GitHub" 
//         waitFor{to GitHubPage}
//         AvatarImage.click()
//         waitFor{SignOutGit}
//         SignOutGit.click()

//     and: "Log out from BC Developers Exchange"
//         waitFor{to HomePage}
//         def  logoffOK=login."Logout as user"()
//         assert logoffOK
   
//     where: "The values to create the Users are:"
//         Login | Pwd 
//         "hibouleblanc"|"Devex_Test1" 
//         "hectorcunniculus"|"Devex_Test1"  
//   }

// def "User Hugo, logs again and accept the request to join the Company from the two previous users" () {
//     given: "Starting from the Home Page"
//         waitFor {to HomePage}

//     when: "Click on the Sign In  link to go to the Authentication page"
//         waitFor{SigninLink} //The definition for this element includes a Click

//     then: "Arrive at the Authenticaion page"    
//         waitFor{at AuthenticationSigninPage}

//     and: "Click on the: 'Sign in with you GitHub account'"
//         waitFor{SignInButton.click()}

//     and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
//         waitFor{at GitHubSignInPage}
        
//         waitFor{GitHubSignInButton} //If this element is present the page has loaded
// 		GitHubLogin.value("hugochibougamau")
// 		GitHubPwd.value("Devex_Test1")
//         GitHubSignInButton.click()
//         sleep(2000) //Leave time case the next page is the reauthorization page

//     and:"If redirected to the reauthorization page, click to reauthorize"    
//         assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

//     then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
//         waitFor{at HomePage} //verify we are in the home page
//         sleep(3000) //The icons take a little time to appear
//         assert AvatarImage  //Verify the avatar image is present. In the future I may check the image is correct

//     and: "Click on the Messages icon. This icon should reflect there are messages waiting"
//         assert UnreadMessageIcon.text().toInteger()>0
//         UnreadMessageIcon.click()
//         sleep(2000) // Do not trust the waitFor
    
//     then: "Redirects to the message page"
//         waitFor{at MessagesPage}

//     and: "Open the drop down by clicking the top right icon"   
//         AvatarImage.click()

//     and: "Click on the newly created Company name that appears in the drop down"     
//         waitFor{$("a", text: contains("Hugo and friend\'s Company")).click()}

//     then: "It bring us to the page that defines the new company. There we click to accept for one of the users"
//         waitFor{$("button",'data-automation-id':"btnAcceptMember",0)}
//         $("button",'data-automation-id':"btnAcceptMember",0).click() //Accept the first user

//     and: "Click yes to confirm in the modal box"
//         $("button",'data-automation-id':"button-modal-yes").click()
//         sleep(1000) //For the modal box to dissappear
   
//     and: "Wait to dissappear the modal box, and then reject the second user"
//         waitFor{$("button",'data-automation-id':"btnDeclineMember",0)}//After accepting the previous user, it dissappears, so the 'second' user in the list becames 'first'
//         $("button",'data-automation-id':"btnDeclineMember",0).click() //Reject the second user
//         sleep(1000)  //For the modal box to dissappear

//     and: "Click No to confirm the rejection in the modal box"
//         $("button",'data-automation-id':"button-modal-no").click()
//         sleep(1000)  //For the modal box to dissappear

//     then: "Hugo can log off from BC Exchange and GitHub"    
//         waitFor{to HomePage}
//         def  logoffOK=login."Logout as user"()
//         assert logoffOK

//     and: "Log out user from GitHub" 
//         waitFor{to GitHubPage}
//         AvatarImage.click()
//         waitFor{SignOutGit}
//         SignOutGit.click()
//   }

//     def "User Hugo Chibougamau updates the Company Info" () {
//         def actions = new Actions(driver)
    
//         given: "Starting from the Home Page"
//            waitFor {to HomePage}

//         when: "Click on the Sign In  link to go to the Authentication page"
//           SigninLink //The definition for this element includes a Click
//          at AuthenticationSigninPage 

//         and: "Click on the: 'Sign in with you GitHub account'"
//             SignInButton.click()

//         and: "Arrive to the GitHub login page, where we will be able to log using the credentials 'hugochibougamau' and 'Devex_Test1'"
//             at GitHubSignInPage
        
//             waitFor{GitHubSignInButton} //If this element is present the page has loaded
// 		    GitHubLogin.value("hugochibougamau")
// 		    GitHubPwd.value("Devex_Test1")
//             GitHubSignInButton.click()
//             sleep(2000) //Leave time case the next page is the reauthorization page


//         and:"If redirected to the reauthorization page, click to reauthorize"    
//             assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

//         then: "After successful Login, arrive at the home page, but this time showing the users' avatar"
//             waitFor{at HomePage} //verify we are in the home page
//             sleep(3000) //The icons take a little time to appear
//             assert AvatarImage  //Verify the avatar image is present. In the future I may check the image is correct

//         and: "Open the drop down by clicking the top right icon"   
//             AvatarImage.click()

//         and: "Click on the newly created Company name that appears in the drop down"     
//             waitFor{$("a", text: contains("Hugo and friend\'s Company")).click()}

//         then:"It bring us to the page that defines the new company. "   
//             waitFor{at OrgDetailsPage}

//         then: "There we click over the company info to make the edit button visible"
//             waitFor{$('data-automation-id':"lblBusinessRegistration" )}//I use this element because I already had wrote a label for it
//             $('data-automation-id':"lblBusinessRegistration" ).click()
//             sleep(1000)

//         and: "After the edit button becames visible, I click on it"
//             $("button",'data-automation-id':"btnEdit_right" ).click() 
//             sleep(1000)

//         and: "Change some values"  
//             City.value("Malcom Island") 
//             ContactName.value("Hugo Chibougamau")  //Correcting the spelling mistake
//             SaveCompanyOtherInformationBtn.click()
//             sleep(1000) //There is an angular animation and I prefer is gone before proceeding

//         expect: "Verify the changes have took effect"
//             assert  $("div",'data-automation-id':"lblBusinessCityPostalCode" ).text()=="Malcom Island V1V 2L2"
//             assert  $("div",'data-automation-id':"lblBusinessContactName"  ).text()=="Hugo Chibougamau"
//     }

        // TODO - Abstract this to deleteCompany(String companyName)
        def "Deleting a company a company" () {
            
            def actions = new Actions(driver)  
            
            given: "I am logged in as an admin user"                
            and: "I select a company"
                CompaniesNavbar //this reference already includes a click
                waitFor{at CompaniesPage}
                sleep(1000)
                // Enter the company's name in the search textbox and select the first item in resulting list              
                waitFor {CompanySearchTextbox.value(companyName)}
                WebElement element = CompanyTable.$('tbody tr').firstElement()
                actions.moveToElement(element).build().perform()//Hovering over makes the gear/Admin button visible

            and: "I access the settings menu"
                waitFor{$("button",'data-automation-id':"btnOrgAdmin" ,0).click()} //Just in case there are more than one company listed
                sleep(1000) //to give time to the pop up window to appear

            when:"I click on the 'Delete Company' button"
                waitFor{$("button",'data-automation-id':"btnDelete").click()}    
                waitFor{$("button",'data-automation-id':"button-modal-yes").click()}

            then:"The company is deleted"                
                waitFor {at CompaniesPage}
                waitFor {CompanySearchTextbox.value(companyName)}
                assert CompanyTable.$('tbody tr').size()==0
                 
            where:
                companyName << ["DevEx Company"]              
        }

        def cleanupSpec(){
            //Logoff as user
            waitFor{to HomePage}
            sleep(1000)  //Do not fully trust waitFor
            def  logoffOK=login."Logout as user"()
            assert logoffOK            
        }

}