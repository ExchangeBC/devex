import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.CompaniesPage
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


@Title("Validate that unauthenticated users don't have a 'register company' button but authenticated users do.")
class CompanyLoginValidationSpec extends GebReportingSpec {

  @Unroll
  def "Test that an unauthenticated user doesn't see the register company button" () {
      given:
          to HomePage
          
          when: "I go to the companies page as an unauthenticated user"
          waitFor { to CompaniesPage }

          then: "I should not see a 'register company' button"
          assert { !RegisterCompanyButton }
  }

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



}
