//package com.athaydes.spockframework.report
import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.CodewithusPage
//import pages.app.CompaniesPage
import pages.app.OpportunitiesPage

import pages.app.AuthenticationSigninPage

import pages.app.GitHubPage_ReadGuide

import modules.Utils
//import pages.app.SignedIn

import modules.LoginModule

//import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys
//import extensions.AngularJSAware

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title



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
            reportInfo("URL 1 line 112 is ${driver.currentUrl}"  )    
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

            DownloadTerms.click()
            sleep(2000)
      then: "I check the downloaded document matches the one stored in this system"
            def  ComparisonOK = CompareFileContents()
            assert ComparisonOK
      then: "Click on the Authenticate button"
            //AuthenticationIcon { $('a[id = "authentication.signin"]')}
            reportInfo("URL line 141 is ${driver.currentUrl}"  )
            $('a[id = "authentication.signin"]').click()
            assert(1000)
            assert AuthenticationSigninPage
            sleep(1000)
            at AuthenticationSigninPage
       
            reportInfo("URL line 145 is ${driver.currentUrl}"  )
            SingInButton.click()
            sleep(1000)
      and: "I arrive to the GitHub page, where I will be able to log"      
            reportInfo("URL line 151 is ${driver.currentUrl}"  )
            sleep(1000)
            //Verifies the sign in button exists

            assert $("input", name:"commit" )




		$(id:"login_field").value('hugochibougamau')
		$(id:"password").value('Devex_Test1')
            $("input", name:"commit" ).click()

            sleep(10000)

           //s assert $("head > title" ).value()=="Sign in to GitHub · GitHub"

//#opportunities\.view > div.label-title.ng-binding
  }


}

