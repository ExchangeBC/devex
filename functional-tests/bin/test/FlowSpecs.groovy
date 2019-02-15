import geb.spock.GebReportingSpec

import pages.app.AboutPage
import pages.app.AccessibilityPage
import pages.app.AdminGovsPage
import pages.app.AdminNotifymeetsPage
import pages.app.AdminNotifyoppsPage
import pages.app.AdminUsersPage
import pages.app.APIPage
import pages.app.ApiAuthSignoutPage
import pages.app.AuthenticationGovernmentPage
import pages.app.AuthenticationSigninPage
import pages.app.AuthenticationSigninadminPage
import pages.app.CodewithusPage
import pages.app.CompaniesPage
import pages.app.CopyrightPage
import pages.app.DisclaimerPage
import pages.app.HomePage
import pages.app.NotificationsPage
import pages.app.OpportunitiesPage
import pages.app.OpportunityDetailPage

import pages.app.PrivacyPage
import pages.app.ProfilesPage
import pages.app.ProgramsPage
import pages.app.ProjectsPage
import pages.app.ProposalsPage

import pages.app.SettingsPicturePage
import pages.app.SettingsProfilePage
import pages.app.SprintwithusPage


import spock.lang.Unroll
import spock.lang.Title
import spock.lang.Issue

@Title("Basic Link Checker to verify that the application is up and running.")
class FlowSpecs extends GebReportingSpec {

  @Unroll
  def "Navigate Page from: #StartPage, click Link: #ClickLink, Assert Page: #AssertPage"(){
    given: "I start on the #StartPage"
		  to StartPage
    when: "I click on the #ClickLink"
       page."$ClickLink"
    then: "I arrive on the #AssertPage page"
	     at AssertPage
    where:
         StartPage | ClickLink               || AssertPage 
         HomePage  | "HomeLink"              || HomePage
         HomePage  | "CompaniesNavbar"       || CompaniesPage
         HomePage  | "ProgramsNavbar"        || ProgramsPage
         HomePage  | "ProjectsNavbar"        || ProjectsPage
         HomePage  | "OpportunitiesNavBar"   || OpportunitiesPage
         HomePage  | "SigninLink"            || AuthenticationSigninPage 
         HomePage  | "AboutLink"             || AboutPage
         HomePage  | "AccessibilityLink"     || AccessibilityPage
         HomePage  | "CodewithusLink"        || CodewithusPage
         HomePage  | "SprintwithusLink"      || SprintwithusPage
         HomePage  | "DisclaimerLink"        || DisclaimerPage
         HomePage  | "PrivacyLink"           || PrivacyPage
         HomePage  | "SigninadminLink"       || AuthenticationSigninadminPage 
         HomePage  | "Copyright"             || CopyrightPage
         HomePage  | "API"                   || APIPage
         OpportunitiesPage|"cwuLearnMore"     || CodewithusPage
         OpportunitiesPage|"swuLearnMore"     || SprintwithusPage
 }
}
