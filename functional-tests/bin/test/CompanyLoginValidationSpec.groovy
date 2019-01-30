//package com.athaydes.spockframework.report
import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.CompaniesPage

import geb.module.RadioButtons
import org.openqa.selenium.By
import org.openqa.selenium.Keys
//import extensions.AngularJSAware

import spock.lang.Unroll
import spock.lang.Narrative
import spock.lang.Title




@Title("Validate that unauthenticated users don't have a 'register company' button but authenticated users do.")
class CompanyLoginValidationSpec extends GebReportingSpec {

  @Unroll
  def "Test that an unauthenticated user doesn't see the register company button" () {
      given: "Starting from the Home Page"
          to HomePage
          
          when: "I go to the companies page as an unauthenticated user"
          waitFor { to CompaniesPage }

          then: "I should NOT see a 'register company' button"
          assert { !RegisterCompanyButton }
  }

  @Unroll
  def "Test that an authenticated user does see the register company button" () {
        given: "Starting from the Home Page"
            to HomePage

        when: "I log as an Administrator"
            def  loginOK= login."Login As An Administrator"("admin","adminadmin","Admin Local")
            assert loginOK
        
        and: "I should see the admin icon in the top left corner"
            assert { AdminIcon }  
          
        and: "I go to the companies page as an authenticated user"
             waitFor { to CompaniesPage }

        then: "I should see a 'register company' button"
            assert { RegisterCompanyButton }  

        
  }

}


