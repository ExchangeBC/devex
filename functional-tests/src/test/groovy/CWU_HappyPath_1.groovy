//package com.athaydes.spockframework.report
import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.CodewithusPage
//import pages.app.CompaniesPage
import pages.app.OpportunitiesPage
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


  @Unroll
  def "From the Code With Us to Opportunities Page" () {
        given: "Starting with the Code with Us Page"
          to CodewithusPage
        
        when: "I click in the Browse Opportunities Button "
          BrowseOpportunitiesLink

        then: "I should be at the Opportunities Page- So the page exists"
          at OpportunitiesPage
 
  }










}



