//package com.athaydes.spockframework.report
import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.CodewithusPage
//import pages.app.CompaniesPage
import pages.app.OpportunitiesPage

import pages.app.GitHubPage_ReadGuide
//import pages.app.SignedIn

//import modules.LoginModule

//import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys
//import extensions.AngularJSAware

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title



@Title("Code with Us Happy Path 1")
class CodeWithUSHappyPath1 extends GebReportingSpec {
 
 /*
      //We make sure we are not logged as admin
      def setup() {
            to HomePage
                  // Need to login as an admin
            def  loggedOutAsAdmin= login."adminLogout"()
            assert loggedOutAsAdmin
      }


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
            sleep(10000)
        reportInfo("URL 1 is ${driver.currentUrl}"  )    
      then: "I should be at the Opportunities Page- So the page exists"
            assert OpportunitiesPage
            at OpportunitiesPage
            sleep(10000)
            //reportInfo("URL2 is ${driver.currentUrl}"  )
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
sleep(10000)
      then: "We have arrived to the selected opportunity URL"      
            assert NewURL==OppURL

  //           AuthenticationIcon { $('a[id = "authentication.signin"]')}
/*
<a id="authentication.signin" ui-sref="authentication" class="nav-link" href="/authentication">
            <svg class="svg-inline--fa fa-github fa-w-16 fa-lg" aria-hidden="true" data-prefix="fab" 
            data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" data-fa-i2svg=""><path fill="currentColor" 
*/
   //         AuthenticationIcon.click()
sleep(1000)
  }









}



