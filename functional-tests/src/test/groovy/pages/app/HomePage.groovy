package pages.app
import geb.Page

import pages.app.CodewithusPage
import modules.LoginModule
import org.openqa.selenium.By
import org.openqa.selenium.Keys

class HomePage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
    static url = "/"
    static content = {
        login { module LoginModule  }
		HomeLink(wait: true) { $("img", class: "navbar-brand" ) }
		AdminIcon(wait: true) { $('img[class ~="navbar-header-user-image"]') }
		AdminMenuDropDown(wait: true) { $("a",'data-automation-id': "AdminMenuItem") }	
		AboutLink(wait: true) { $("a", id: "about") }
		AccessibilityLink(wait: true) { $("a", id: "accessibility") }
		APIs(wait: true) { $("a", id: "api") }
		AvatarImage(wait: true) { $("img",'data-automation-id':"UserAvatarImage" ) }
		BrowseOpportunities(wait: true) { $("a", 'data-automation-id':"lnkBrowseOpportunities") }
		CodewithusLink(wait: true) { $(('a[data-automation-id ~= "button-codewithus"]'), 0) }
		CompaniesNavbar(wait: true) { $('a[ui-sref ~= "orgs.list"]', 0) }
		Copyright(wait: true) { $("a", id: "copyright") }
		DisclaimerLink(wait: true) { $("a", id: "disclaimer") }
		ForkThisSite(wait: true) { $("a", id: "ForkThisSite") }
		LearnMoreCWU(wait: true) { $('a[data-automation-id ~="button-codewithus"]',0) }
		ManageCapabilities(wait: true) { $("a",id:"capabilities.list") }
		OpportunitiesNavBar(wait: true) { $('a[ui-sref ~= "opportunities.list"]', 0) }
		PrivacyLink(wait: true) { $("a", id: "privacy") }
		ProgramsNavbar(wait: true) { $('a[ui-sref ~= "programs.list"]', 0) }
		ProjectsNavbar(wait: true) { $('a[ui-sref ~= "projects.list"]', 0) }
		SettingsOption(wait: true) { $("a", text: contains("Settings")) }
		SigninadminLink(wait: true) { $("a", id: "authentication.signinadmin") }
		SigninLink(wait: true) { $("a", id: "authentication.signin") }
		SprintwithusLink(wait: true) { $(('a[data-automation-id ~= "button-sprintwithus"]'), 0) }
		UnreadMessageIcon(wait: true) { $("span",'data-automation-id':"unreadMessageIcon") }
    }
}
