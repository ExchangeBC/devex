//package com.athaydes.spockframework.report
import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.CodewithusPage
//import pages.app.CompaniesPage
import pages.app.OpportunitiesPage

import pages.app.AuthenticationSigninPage

import pages.app.InitialCWUProposalPage

import pages.app.GitHubPage_ReadGuide
import pages.app.SettingsProfilePage
//import pages.app.MCEFrame

//import modules.Utils
//import pages.app.SignedIn
//import geb.module.Textarea
import modules.LoginModule


//import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys
//import extensions.AngularJSAware
import spock.lang.Stepwise
import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

@Stepwise

@Title("Code with Us Happy Path 1")
class CWU_HappyPath_1 extends GebReportingSpec {

      def CompareFileContents() {
           //if(f1.length()!=f2.length())return false

            //println("User directory is:" + System.getProperty('user.home') )
            File FilePath1=new File(System.getProperty('user.home')+"/Downloads/code-with-us-terms.pdf")
            File FilePath2=new File(System.getProperty('user.home')+"/Feina/Contractes/BCDEVEX/devex/functional-tests/src/test/resources/code-with-us-terms.pdf")

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
                def ftd=new File(System.getProperty('user.home')+"/Downloads/code-with-us-terms.pdf")
                ftd.delete()
            }

            return true
      }

 


      //We make sure we are not logged as admin
      def setup() {
            waitFor{to HomePage}
            //I get the base URL to build (in the LoginModule) the URL to the admin icon
            def baseURL = getBrowser().getConfig().getBaseUrl().toString()

            // Login off as an admin
            def  logoffOK=login."Logout as administrator"(baseURL)
            assert logoffOK
      }




  def "From the Home Page to the CWU" () {

      given: "Starting at the Home Page"
            waitFor { to HomePage}

      when: "I click on Learn More button"
            LearnMoreCWU

      then: "I should be at the CodeWithUs Page- So the page exists"
            at CodewithusPage
            println("URL -1  is ${driver.currentUrl}"  )

      and: "Check Developers button is active"
            assert DevelopersButtonClass=="nav-link active"
            println("URL -2  ${driver.currentUrl}"  )

      and: "Check the Public Sector Product Managers link is inactive"
            assert PublicSectorProductManagers=="nav-link"
            println("URL -3 ${driver.currentUrl}"  )

      and: "Click on the 'Read the Guide button' to end in the 'https://github.com/BCDevExchange/code-with-us/wiki/3.--For-Developers:-How-to-Apply-on-a-Code-With-Us-Opportunity' page"
            ReadtheGuideLink.click()
            sleep(3000)
            println("URL -4 ${driver.currentUrl}"  )
            assert GitHubPage_ReadGuide
            println("assert we are in the GITHub Read Guide page")

  }


  def "From the Code With Us to Opportunities Page" () {
      given: "Starting with the Code with Us Page"
            waitFor{to CodewithusPage}
            //println("URL0 is ${driver.currentUrl}"  )
      when: "I click in the Browse Opportunities Button "
            BrowseOpportunitiesLink
            sleep(3000)
            println("URL 1 line 112 is ${driver.currentUrl}"  )
      then: "I should be at the Opportunities Page- So the page exists"
            assert OpportunitiesPage
            at OpportunitiesPage
            println("URL2 is ${driver.currentUrl}"  )
      and: "I click on the first opportunity listed on the page"
            def OppTitle =FirstListedOpportunity.text()  //Opportunity title
            def MyCurrentURL=getCurrentUrl() //URL opportunity page
            //The following is to create from the opp title the URL
            def OppURL= MyCurrentURL + "/cwu/opp-" + OppTitle.replaceAll(' ','-').replaceFirst(':','').replaceAll(':','-').toLowerCase()
            println("${OppTitle} " )
            println("${OppURL} " )
            FirstListedOpportunity.click()
            sleep(1000)

            def NewURL=getCurrentUrl() //This is the specific opportunity URL
            println("URL3 is ${driver.currentUrl}"  )

      then: "We have arrived to the selected opportunity URL"
            assert NewURL==OppURL
            sleep(1000)
      and: "Click on terms, to download the document that sets the terms and the legalese"
            println("URL line 139 is ${driver.currentUrl}"  )
            DownloadTerms.click()
            sleep(2000)
      then: "I check the downloaded document matches the one stored in this test"
            def  ComparisonOK = CompareFileContents()
            assert ComparisonOK
      then: "Click on the Authenticate button"
            //AuthenticationIcon { $('a[id = "authentication.signin"]')}
            println("URL line 141 is ${driver.currentUrl}"  )
            $('a[id = "authentication.signin"]').click()
            assert(1000)
            assert AuthenticationSigninPage
            sleep(1000)
            at AuthenticationSigninPage

            println("URL line 151 is ${driver.currentUrl}"  )
            SingInButton.click()

            sleep(1000)
      and: "I arrive to the GitHub page, where I will be able to log"
            println("URL line 156 is ${driver.currentUrl}")
            sleep(1000)
            //Verifies the sign in button exists

            assert $("input", name:"commit" )

		$(id:"login_field").value('hugochibougamau')
		$(id:"password").value('Devex_Test1')
            $("input", name:"commit" ).click()
            sleep(1000)

      then: "Once logged we are in the HomePage. Here we verify the default user icon is there proving we are logged"
            at HomePage  //verify we are in the home page
            def AdminIconLocation = 'https://avatars1.githubusercontent.com/u/46409451?v=4' //This is the default icon for a logged user
            assert $("img",src:"${AdminIconLocation}")


      and: "Click the Browse Opportunties button"
            BrowseOpportunities.click()
      then: "We return to the Opportunities page"
            at OpportunitiesPage
            sleep(1000)
      when: "I click again on the first opportunity listed on the page, this time as a logged-in user"
            OppTitle =FirstListedOpportunity.text()  //Opportunity title
            MyCurrentURL=getCurrentUrl() //URL opportunity page
            //The following is to create from the opp title the URL
            OppURL= MyCurrentURL + "/cwu/opp-" + OppTitle.replaceAll(' ','-').replaceFirst(':','').replaceAll(':','-').toLowerCase()
            println("${OppTitle} " )
            println("${OppURL} " )
            FirstListedOpportunity.click()
            sleep(100)

            NewURL=getCurrentUrl() //This is the specific opportunity URL

      then: "We have arrived to the selected opportunity URL"
            assert NewURL==OppURL
            sleep(1000)
             //println("OppURL is ${driver.currentUrl}"  )
             //println("URL after waiting 60s is ${driver.currentUrl}"  )
      and: "Click on Start a proposal button"
            println("URL line 200 is ${driver.currentUrl}"  )
            $("button",0, id:"proposaladmin.create").click()

      then: " Arrive to the page that allows to submit a proposal"
            //we verify we are in the correct page by checking the 'Proposal' tab exists
            sleep(1000)
            at InitialCWUProposalPage
            println("URL line 208 is ${driver.currentUrl}"  )
            //assert $('li[class="uib-tab nav-item ng-scope ng-isolate-scope"][index="2"]').click()
    
    
      and: "Confirm the Company tab is present but disabled"
            assert !$(('a[class~= "nav-link ng-binding disabled"]'),0).empty()

      and: "Confirm the attachment tab is not even present "
            assert(!AttachmentTab.displayed)
            //println(AttachmentTab)

      and: "Click the Terms tab to accept the terms"
            TermsTab.click()
            CheckTerms.click()

      and: "Save this first draft"
            ButtonSaveChanges.click()
            sleep(1000)

      then: "Check the Attachment tab is present"
            assert(AttachmentTab.displayed)

      and: "Click on the Attachment tab"  
            // At this moment I do not know how to upload a file
            AttachmentTab.click()   
      
      and: "Click on the Proposal tab"  
            waitFor{at InitialCWUProposalPage}
            sleep(1000)
            ProposalTab.click()  
            println("Line 246 before waiting for the Proposal Description Box")
            waitFor{ProposalDescriptionBox}
            //Note: the 'body' is inside an iframe. To identify the iframe I use the title because the id changes depending on the browser we are using.
            withFrame(ProposalDescriptionBox){$("body", id:"tinymce") << 'Les Nenes Maques'}
            

      and: "Delete the proposal, part to check for functionality, part for clean up" 
            ButtonDelete.click()   
            sleep(1000)
            ButtonModalYes.click()  
            sleep(1000)


      then: "End"      


            sleep(1000)


  }

        def cleanup(){//Logoff as user
            to HomePage
            sleep(10000)
            //I get the base URL to build (in the LoginModule) the URL to the admin icon
            def baseURL = getBrowser().getConfig().getBaseUrl().toString()
            println("the URL is "+ baseURL)
            // Login off as an admin
            def  logoffOK=login."Logout as user"()
            assert logoffOK
        }


}



