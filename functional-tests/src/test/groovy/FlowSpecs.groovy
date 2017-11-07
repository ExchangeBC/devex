import geb.spock.GebReportingSpec

import pages.app.HomePage
import pages.app.AboutPage
import pages.app.AccessibilityPage
import pages.app.AdminGovsPage
import pages.app.AdminNotifymeetsPage
import pages.app.AdminNotifyoppsPage
import pages.app.AdminUsersPage
import pages.app.ApiAuthSignoutPage
import pages.app.AuthenticationGovernmentPage
import pages.app.AuthenticationSigninadminPage
import pages.app.AuthenticationSigninPage
import pages.app.CodewithusPage
import pages.app.CopyrightPage
import pages.app.DisclaimerPage
import pages.app.HomePage
import pages.app.NotificationsPage
import pages.app.OpportunitiesPage
import pages.app.PrivacyPage
import pages.app.ProfilesPage
import pages.app.ProgramsPage
import pages.app.ProjectsPage
import pages.app.ProposalsPage
import pages.app.RoadmapPage
import pages.app.SettingsPicturePage
import pages.app.SettingsProfilePage

import pages.app.SignedIn
import pages.app.OpportunityDetail
import spock.lang.Unroll
//import javax.xml.crypto.dsig.SignedInfo


class FlowSpecs extends GebReportingSpec {

    @Unroll
    def "Navigate Page from: #StartPage, click Link: #ClickLink, Assert Page: #AssertPage"(){
	    given: "I start on the #StartPage"
			to StartPage
            login."Login as an adminstrator"("admin","adminadmin","ADMIN LOCAL")
        when: "I click on the link #ClickLink"
            //println page."$clickLink".text()
        
        // js.exec('window.scrollTo(0, document.body.scrollHeight);')
        // js.exec('window.scrollTo(document.body.scrollHeight, 0);')
        // js.exec('document.getElementById("authentication.signinadmin").scrollIntoView(true);')
        //waitFor { page."$ClickLink".click() }
        page."$ClickLink"
        then:
			at AssertPage
		
        where:
        StartPage | ClickLink || AssertPage 
        HomePage | "AboutLink" || AboutPage
        HomePage | "AccessibilityLink" || AccessibilityPage
        HomePage | "CodewithusLink" || CodewithusPage
        HomePage | "CopyrightLink" || CopyrightPage
        HomePage | "DisclaimerLink" || DisclaimerPage
        HomePage | "PrivacyLink" || PrivacyPage
        HomePage | "RoadmapLink" || RoadmapPage
        HomePage | "SigninadminLink" || AuthenticationSigninadminPage        
        HomePage | "OpportunitiesMenuLink" || OpportunitiesPage
        HomePage | "ProjectsLink" || ProjectsPage
        HomePage | "ProgramsLink" || ProgramsPage
        HomePage | "SigninLink" || AuthenticationSigninPage
        HomePage | "SignUpMidPageLink" || AuthenticationGovernmentPage
        HomePage | "AboutMidPageLink" || AboutPage
        HomePage | "LearnMoreLink" || CodewithusPage

       // HomePage | "AdminGovsLink" || AdminGovsPage
      //  HomePage | "AdminNotifymeetsLink" || AdminNotifymeetsPage
      //  HomePage | "AdminNotifyoppsLink" || AdminNotifyoppsPage
      //  HomePage | "AdminUsersLink" || AdminUsersPage
      //  HomePage | "ApiAuthSignoutLink" || ApiAuthSignoutPage
       // HomePage | "NotificationsLink" || NotificationsPage
       // HomePage | "ProfilesLink" || ProfilesPage
      //  HomePage | "ProposalsLink" || ProposalsPage
       // HomePage | "SettingsPictureLink" || SettingsPicturePage
       // HomePage | "SettingsProfileLink" || SettingsProfilePage
   }
}
