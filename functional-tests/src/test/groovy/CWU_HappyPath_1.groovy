package com.athaydes.spockframework.report

import geb.spock.GebReportingSpec

import pages.app.HomePage
//import pages.app.LearnMore_CWU_Page
import pages.app.CodewithusPage
import pages.app.CompaniesPage
import pages.app.OpportunitiesPage

import pages.app.SignedIn

import modules.LoginModule

import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys
//import extensions.AngularJSAware


import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title

import geb.spock.GebReportingSpec


@Title("Code with Us Happy Path")


class CWU_HappyPath_1 extends GebReportingSpec {

def setup() { 
browser.config.cacheDriver = false
browser.driver = browser.config.driver

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
          
        and: "Check Developers button is active"
              assert DevelopersButtonClass=="nav-link active" 

        and: "Check the Public Sector Product Managers link is inactive"    
              assert PublicSectorProductManagers=="nav-link"

  }
*/

  @Unroll
  def "From the Code With Us to Opportunities Page" () {
        given: "Starting with the Code with Us Page"
          to CodewithusPage
        
        when: "I click in the Browse Opportunities Button "
          BrowseOpportunitiesLink

        then: "I should be at the Opportunities Page- So the page exists"
          at OpportunitiesPage
 
  }

/*

  @Unroll
  def "Test that an authenticated user does see the register company button" () {
      given:
          to HomePage

          when: "I login as dev"
          def LoginOk = LoginModule."Login as an adminstrator"("admin","adminadmin","Admin Local")



          //def loginOK = login."Login"("admin","adminadmin","Admin Local")
          assert loginOK
          
          and: "I go to the companies page as an authenticated user"
          waitFor { to CompaniesPage }

          then: "I should see a 'register company' button"
          assert { RegisterCompanyButton }
  }



     def cleanupSpec() {
        //browser.quit()
        resetBrowser()
        
        println "Clean up specification"
    }


    def cleanup() {
        reportInfo( "cleanup browser: $browser")
       
    }

*/
}



