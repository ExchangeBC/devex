//package com.athaydes.spockframework.report
package specs

import geb.spock.GebReportingSpec

import specs.traits.Login

import pages.app.HomePage
import pages.app.AuthenticationSigninadminPage

import spock.lang.Title


@Title("Validate that unauthenticated users don't have a 'register company' button but authenticated users do.")
class LoginSpec extends GebReportingSpec {

  void setup() {
    to HomePage
    SigninadminLink
    at AuthenticationSigninadminPage
  }

  void 'Signing in as an Admin User'() {
    given: 'I have navigated to the Admin Login page'
    when: 'I enter credentials to login as an admin user'
      //logInAsAdminUser() 
      //   Map env = System.getenv()
      //   Username.value(env['DEV_ADMIN_USERNAME'])
      //   Password.value(env['DEV_ADMIN_PWD'])   
      Username.value("admin")
      Password.value("adminadmin") 
      SignInButton.click() 
    then: 'I am logged in as an admin user'
      at HomePage      
  }

  void 'Signing in as a Local User '() {
    given: 'I have navigated to the Admin Login page'
    when: 'I enter credentials to login as a local user'
      //logInAsLocalUser() 
      Username.value("user")
      Password.value("useruser")  
      SignInButton.click()   
    then: 'I am logged in as a local user'
      at HomePage      
  }

  void 'Signing in as a Dev User'() {
    given: 'I have navigated to the Admin Login page'
    when: 'I enter credentials to login as a dev user'
      //logInAsDevUser()
      Username.value("dev")
      Password.value("devdev")
      SignInButton.click()
    then: 'I am logged in as a dev user'
      at HomePage      
  }

  void 'Signing in as a Dev2 User'() {
    given: 'I have navigated to the Admin Login page'
    when: 'I enter credentials to login as a dev2 user'
      //logInAsDev2User()
      Username.value("dev2")
      Password.value("devdev")
      SignInButton.click()
    then: 'I am logged in as a dev2 user'
      at HomePage      
  }

  void 'Signing in as a Gov User'() {
    given: 'I have navigated to the Admin Login page'
    when: 'I enter credentials to login as a gov user'
      //logInAsGovUser()
      Username.value("gov")
      Password.value("govgov")
      SignInButton.click()
    then: 'I am logged in as a gov user'
      at HomePage      
  }
}