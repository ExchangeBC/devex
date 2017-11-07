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


class OtherSpecs extends GebReportingSpec {

    def "3 (b) Applying for an opportunity - not signed in" () {
        given:
            to OpportunityDetail
        expect:
            assert $('div',"ng-if":"!vm.loggedIn").displayed  == true
    }

    def "4 Admin Login/Logout" () {
        given:
            to HomePage
        when: "I click on admin Login"
            assert login."Login as an adminstrator"("admin","adminadmin","ADMIN LOCAL")
        then: 
            at SignedIn
            assert login.adminLogout()
            at HomePage
    }
}
