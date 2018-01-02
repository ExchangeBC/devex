import geb.spock.GebReportingSpec

import pages.app.AboutPage
import pages.app.AccessibilityPage
import pages.app.AdminGovsPage
import pages.app.AdminNotifymeetsPage
import pages.app.AdminNotifyoppsPage
import pages.app.AdminUsersPage
import pages.app.ApiAuthSignoutPage
import pages.app.AuthenticationGovernmentPage
import pages.app.AuthenticationSigninPage
import pages.app.AuthenticationSigninadminPage
import pages.app.CodewithusPage
import pages.app.CopyrightPage
import pages.app.DisclaimerPage
import pages.app.HomePage
import pages.app.HomePage
import pages.app.NotificationsPage
import pages.app.OpportunitiesPage
import pages.app.OpportunityDetailPage
import pages.app.OrgsListPage
import pages.app.PrivacyPage
import pages.app.ProfilesPage
import pages.app.ProgramsPage
import pages.app.ProjectsPage
import pages.app.ProposalsPage
import pages.app.RoadmapPage
import pages.app.SettingsPicturePage
import pages.app.SettingsProfilePage

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
    HomePage  | "CompaniesNavbar"       || OrgsListPage
    HomePage  | "ProgramsNavbar"        || ProgramsPage
    HomePage  | "ProjectsNavbar"        || ProjectsPage
    HomePage  | "OpportunitiesNavBar"   || OpportunitiesPage
    HomePage  | "SignUpNavBar"          || AuthenticationGovernmentPage
    HomePage  | "SigninLink"            || AuthenticationSigninPage 
    HomePage  | "SignUpMidPageLink"     || AuthenticationGovernmentPage
    HomePage  | "FindWorkButton"        || OpportunitiesPage
    HomePage  | "learnMoreLink"         || CodewithusPage
    HomePage  | "AboutLink"             || AboutPage
    HomePage  | "AccessibilityLink"     || AccessibilityPage
    HomePage  | "CodewithusLink"        || CodewithusPage
    HomePage  | "CopyrightLink"         || CopyrightPage
    HomePage  | "DisclaimerLink"        || DisclaimerPage
    HomePage  | "PrivacyLink"           || PrivacyPage
    HomePage  | "RoadmapLink"           || RoadmapPage
    HomePage  | "SigninadminLink"       || AuthenticationSigninadminPage        

// For future expansion
    //HomePage | "AboutMidPageLink" || AboutPage
    //HomePage | "AdminGovsLink" || AdminGovsPage
    //HomePage | "AdminNotifymeetsLink" || AdminNotifymeetsPage
    //HomePage | "AdminNotifyoppsLink" || AdminNotifyoppsPage
    //HomePage | "AdminUsersLink" || AdminUsersPage
    //HomePage | "ApiAuthSignoutLink" || ApiAuthSignoutPage
    //HomePage | "NotificationsLink" || NotificationsPage
    //HomePage | "ProfilesLink" || ProfilesPage
    //HomePage | "ProposalsLink" || ProposalsPage
    //HomePage | "SettingsPictureLink" || SettingsPicturePage
    //HomePage | "SettingsProfileLink" || SettingsProfilePage
 }
}
