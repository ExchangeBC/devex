//package com.athaydes.spockframework.report
import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.AuthenticationSigninPage
import pages.app.InitialCWUProposalPage
import pages.app.CodewithusPage
import pages.app.GitHubPage_ReadGuide
import pages.app.OpportunitiesPage
import pages.app.SettingsProfilePage

import modules.LoginModule

import org.openqa.selenium.By
import org.openqa.selenium.Keys

import spock.lang.Stepwise
import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title


@Narrative('''In this test, the user 'HugoChibougamau' logs into the system and  presents a CWU
proposal.
 ''')

@Stepwise

@Title("Code with Us Happy Path 1")
class CWU_HappyPath_1 extends GebReportingSpec {
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

      def CompareFileContents() {
            File FilePath1=new File(System.getProperty('user.home')+"/Downloads/code-with-us-terms.pdf")
            //File FilePath2=new File(System.getProperty('user.home')+"/Feina/Contractes/BCDEVEX/devex/functional-tests/src/test/resources/code-with-us-terms.pdf")
            File FilePath2=new File(System.getProperty('user.dir')+"/src/test/resources/code-with-us-terms.pdf")
println(FilePath1)
println(FilePath2)
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
            waitFor{at CodewithusPage}

      and: "Check Developers button is active"
            assert DevelopersButtonClass=="nav-link active"

      and: "Check the Public Sector Product Managers link is inactive"
            assert PublicSectorProductManagers=="nav-link"

      and: "Click on the 'Read the Guide button' to end in the 'https://github.com/BCDevExchange/code-with-us/wiki/3.--For-Developers:-How-to-Apply-on-a-Code-With-Us-Opportunity' page"
            ReadtheGuideLink.click()
            sleep(3000) //time to download the document
            assert GitHubPage_ReadGuide
  }


  def "In this section the user logs, submits a proposal" () {
      given: "Starting with the Code with Us Page"
            waitFor{to CodewithusPage}

      when: "I click in the Browse Opportunities Button "
            BrowseOpportunitiesLink
            sleep(1000) 

      then: "I should be at the Opportunities Page- So the page exists"
            assert waitFor{OpportunitiesPage}
            at OpportunitiesPage
 
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

      then: "We have arrived to the selected opportunity URL"
            assert NewURL==OppURL
            sleep(1000)

      and: "Click on terms, to download the document that sets the terms and the legalese"
            DownloadTerms.click()
            sleep(5000)//wait for document to download

      then: "I check the downloaded document matches the one stored in this test"
            def  ComparisonOK = CompareFileContents()
            assert ComparisonOK

      then: "Click on the Authenticate button"
            $('a[id = "authentication.signin"]').click()
            assert(1000)
            assert AuthenticationSigninPage
            sleep(1000)
            at AuthenticationSigninPage
            SignInButton.click()
            sleep(1000)

      and: "I arrive to the GitHub page, where I will be able to log"
            assert waitFor{$("input", name:"commit" )}//Verifies the sign in button exists
		$(id:"login_field").value('hugochibougamau')
		$(id:"password").value('Devex_Test1')
            $("input", name:"commit" ).click()
            sleep(2000) //Leave time case the next page is the reauthorization page

      and:"If redirected to the reauthorization page, click to reauthorize"    
            assert CheckIfReauthIsNeeded() //Actually, it always returns true, I kept it mainly if in the future I add some error catching or more complicated logic

      then: "Once logged we are in the HomePage. Here we verify the default user icon is there proving we are logged"
            at HomePage  //verify we are in the home page
            def AdminIconLocation = 'https://avatars1.githubusercontent.com/u/46409451?v=4' //This is the default icon for a logged user
            assert $("img",src:"${AdminIconLocation}")


      and: "Click the Browse Opportunities button"
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

      and: "Click on Start a proposal button"
            $("button",0, id:"proposaladmin.create").click()
            sleep(1000)

      then: " Arrive to the page that allows to submit a proposal"
            waitFor{at InitialCWUProposalPage}
    
      and: "Confirm the Company tab is present but disabled"
            assert !$(('a[class~= "nav-link ng-binding disabled"]'),0).empty()

      and: "Confirm the attachment tab is not even present "
            assert(!AttachmentTab.displayed)

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

      then: "End by saving this draft"
            waitFor{ButtonSaveChanges.click()}

  }

        def teardown(){//Logoff as user
            waitFor{to HomePage}
            sleep(1000)  //Do not fully trust waitFor
            def  logoffOK=login."Logout as user"()
            assert logoffOK
        }


}



