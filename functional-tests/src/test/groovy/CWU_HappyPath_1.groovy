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
class CodeWithUSHappyPath1 extends GebReportingSpec {

      def CompareFileContents() {
           //if(f1.length()!=f2.length())return false

            //reportInfo("User directory is:" + System.getProperty('user.home') )
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

      void "Set Description"(String desc){
            //waitFor { angularReady }
            withFrame( waitFor { descriptionFrame } ) {
                mceBody << desc
                }
    }


      //We make sure we are not logged as admin
      def setup() {
            to HomePage
            //I get the base URL to build (in the LoginModule) the URL to the admin icon
            def baseURL = getBrowser().getConfig().getBaseUrl().toString()

            // Login off as an admin
            def  logoffOK=login."Logout as administrator"(baseURL)
            assert logoffOK
      }

/*
  @Unroll

  def "From the Home Page to the CWU" () {

      given: "Starting at the Home Page"
            waitFor { to HomePage}

      when: "I click on Learn More button"
            LearnMoreCWU

      then: "I should be at the CodeWithUs Page- So the page exists"
            at CodewithusPage
            reportInfo("URL -1  is ${driver.currentUrl}"  )

      and: "Check Developers button is active"
            assert DevelopersButtonClass=="nav-link active"
            reportInfo("URL -2  ${driver.currentUrl}"  )

      and: "Check the Public Sector Product Managers link is inactive"
            assert PublicSectorProductManagers=="nav-link"
            reportInfo("URL -3 ${driver.currentUrl}"  )

      and: "Click on the 'Read the Guide button' to end in the 'https://github.com/BCDevExchange/code-with-us/wiki/3.--For-Developers:-How-to-Apply-on-a-Code-With-Us-Opportunity' page"
            ReadtheGuideLink.click()
            reportInfo("URL -4 ${driver.currentUrl}"  )
            assert GitHubPage_ReadGuide

  }
*/

  @Unroll
  def "From the Code With Us to Opportunities Page" () {
      given: "Starting with the Code with Us Page"
            to CodewithusPage
            //reportInfo("URL0 is ${driver.currentUrl}"  )
      when: "I click in the Browse Opportunities Button "
            BrowseOpportunitiesLink
            sleep(1000)
            println("URL 1 line 112 is ${driver.currentUrl}"  )
      then: "I should be at the Opportunities Page- So the page exists"
            assert OpportunitiesPage
            at OpportunitiesPage
            sleep(1000)
            reportInfo("URL2 is ${driver.currentUrl}"  )
      and: "I click on the first opportunity listed on the page"
            def OppTitle =PublishedOpportunity.text()  //Opportunity title
            def MyCurrentURL=getCurrentUrl() //URL opportunity page
            //The following is to create from the opp title the URL
            def OppURL= MyCurrentURL + "/cwu/opp-" + OppTitle.replaceAll(' ','-').replaceFirst(':','').replaceAll(':','-').toLowerCase()
            reportInfo("${OppTitle} " )
            reportInfo("${OppURL} " )
            PublishedOpportunity.click()
            sleep(100)

            def NewURL=getCurrentUrl() //This is the specific opportunity URL

      then: "We have arrived to the selected opportunity URL"
            assert NewURL==OppURL
            sleep(1000)
      and: "Click on terms, to download the document that sets the terms and the legalese"
            //$('#page-top > main > ui-view > section > div.container.border.p-4 > div:nth-child(8) > div > p:nth-child(5) > a:nth-child(2)').click()
            println("URL line 136 is ${driver.currentUrl}"  )
            DownloadTerms.click()
            sleep(2000)
      then: "I check the downloaded document matches the one stored in this system"
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
            OppTitle =PublishedOpportunity.text()  //Opportunity title
            MyCurrentURL=getCurrentUrl() //URL opportunity page
            //The following is to create from the opp title the URL
            OppURL= MyCurrentURL + "/cwu/opp-" + OppTitle.replaceAll(' ','-').replaceFirst(':','').replaceAll(':','-').toLowerCase()
            println("${OppTitle} " )
            println("${OppURL} " )
            PublishedOpportunity.click()
            sleep(100)

            NewURL=getCurrentUrl() //This is the specific opportunity URL

      then: "We have arrived to the selected opportunity URL"
            assert NewURL==OppURL
            sleep(1000)
             //reportInfo("OppURL is ${driver.currentUrl}"  )
             //reportInfo("URL after waiting 60s is ${driver.currentUrl}"  )
      and: "Click on Start a proposal button"
            println("URL line 204 is ${driver.currentUrl}"  )

            $("button",0, id:"proposaladmin.create").click()

      then: " Arrive to the page that allows to submit a proposal"
            //we verify we are in the correct page by checking the 'Proposal' tab exists
            sleep(1000)
            at InitialCWUProposalPage
            println("URL line 212 is ${driver.currentUrl}"  )
            //assert $('li[class="uib-tab nav-item ng-scope ng-isolate-scope"][index="2"]').click()
      and: "Confirm the Company tab is present but disabled"
      /*      ask for help to Andrew to locate the page that has the element
      <a href="" ng-click="select($event)" ng-class="[{active: active, disabled: disabled}, classes]" class="nav-link ng-binding disabled" uib-tab-heading-transclude=""><uib-tab-heading data-automation-id="tab-cwu-proposal-company" class="ng-scope">
      <svg class="svg-inline--fa fa-building fa-w-14" aria-hidden="true" data-prefix="fas" data-icon="building" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M436 480h-20V24c0-13.255-10.745-24-24-24H56C42.745 0 32 10.745 32 24v456H12c-6.627 0-12 5.373-12 12v20h448v-20c0-6.627-5.373-12-12-12zM128 76c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12V76zm0 96c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40zm52 148h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12zm76 160h-64v-84c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v84zm64-172c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40zm0-96c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40zm0-96c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12V76c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40z"></path></svg><!-- <i class="fas fa-building"></i> --> Company
          </uib-tab-heading></a>

            I want to check that specific element with class="nav-link ng-binding disabled"  exist
            at this moment I am using the following command, it works but is it dependent on the class. BTW: there are 
            two elements that have that disable class attribute, the Company and the Attachment tab
   */
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
            AttachmentTab.click()   

      // At this moment I do not know how to upload a file
      and: "Click on the Proposal tab"  
             at InitialCWUProposalPage
             sleep(5000)
            ProposalTab.click()  

             "Add Proposal" 'Les Nenes Maques'
sleep(5000)
/*  Different test to try to make the proposal box work
              reportInfo("------> ${$('#tinymce > p').text()}"  )
              reportInfo("------> ${$("textarea",id:"ui-tinymce-1")}")
              reportInfo("------> ${$("textarea",'data-automation-id':"text-proposal-description")}")
            
            //def MyTextArea $(By.xpath('//[@id="ui-tinymce-2_ifr"]/../@id="tinymce"]'))
            //assert $(By.xpath('//*[@id="tinymce"]'))
             //[@class='lmn-edititem-modal']/../[@class=''btn-primary']"

 
            assert $("textarea",'data-automation-id':"text-proposal-description")
            descriptionFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-proposal-description"]//@id,"_ifr")]'), 0) }
            "Set Description" "Lesz nenes ma ues"
            //def MyTextArea=$("textarea",'data-automation-id':"text-proposal-description").module(Textarea)


/           /MyTextArea.text='Lesz nenes ma ues'
  */


      and: "Delete the proposal, part to check for functionality, part for clean up" 
            ButtonDelete.click()   
            sleep(1000)
            ButtonModalYes.click()  
            sleep(1000)


      then: "End"      



            //$('#tinymce > p').text('La mate porque era mia')
 /*
<iframe id="ui-tinymce-6_ifr" frameborder="0" allowtransparency="true"

 title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help" style="width: 100%; height: 100px; display: block;"></iframe>
#tinymce > p
*/
sleep(1000)


  }


        def cleanup(){//Logoff as user
            to HomePage
            //I get the base URL to build (in the LoginModule) the URL to the admin icon
            def baseURL = getBrowser().getConfig().getBaseUrl().toString()

            // Login off as an admin
            def  logoffOK=login."Logout as user"()
            assert logoffOK
        }





}

