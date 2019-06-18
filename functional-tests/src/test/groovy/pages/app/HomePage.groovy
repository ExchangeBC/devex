package pages.app
import geb.Page

import pages.app.CodewithusPage
import modules.LoginModule
import org.openqa.selenium.By
import org.openqa.selenium.Keys
// import extensions.AngularJSAware

class HomePage extends Page {

	// static at = { angularReady && title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
    static url = "/"
    static content = {
        login { module LoginModule  }
        
        //Links
        //HomeLink { PositionAndClick("a","home") }
		HomeLink { $("img", class:"navbar-brand" ).click() }

		AdminIcon { $('img[class ~="navbar-header-user-image"]')}

		AdminMenuDropDown{$("a",'data-automation-id':"AdminMenuItem")}	
		AboutLink { PositionAndClick("a","about") }
		AccessibilityLink { PositionAndClick("a","accessibility") }
		APIs { PositionAndClick("a","api") }
		AvatarImage{$("img",'data-automation-id':"UserAvatarImage" )}
		BrowseOpportunities { $("a", 'data-automation-id':"lnkBrowseOpportunities")}
		CodewithusLink { $(('a[data-automation-id ~= "button-codewithus"]'), 0).click() }
		CompaniesNavbar { $('a[ui-sref ~= "orgs.list"]', 0).click()    }
		Copyright { PositionAndClick("a","copyright") }
		DisclaimerLink { PositionAndClick("a","disclaimer") }
		ForkThisSite { PositionAndClick("a","ForkThisSite") }
		LearnMoreCWU { $('a[data-automation-id ~="button-codewithus"]',0).click() }
		ManageCapabilities{$("a",id:"capabilities.list")}
		OpportunitiesNavBar { $('a[ui-sref ~= "opportunities.list"]', 0).click() }
		PrivacyLink { PositionAndClick("a","privacy") }
		ProgramsNavbar { $('a[ui-sref ~= "programs.list"]', 0).click() }
		ProjectsNavbar { $('a[ui-sref ~= "projects.list"]', 0).click() }
		SettingsOption{$("a", text: contains("Settings"))}
		SigninadminLink { PositionAndClick("a","authentication.signinadmin") }
		SigninLink { PositionAndClick("a","authentication.signin") }
		SprintwithusLink { $(('a[data-automation-id ~= "button-sprintwithus"]'), 0).click() }
		UnreadMessageIcon{$("span",'data-automation-id':"unreadMessageIcon")}//Actually this is part of the header and perhaps should move to a module

    }

    // Since webdriver does not want to click on non-visible links,
    // we have to position the test page show the links before we can click on it.
    // Currently this function only support links with an id.
    Boolean PositionAndClick(String elementType, String elementId, int index=0) {
    		js.exec('document.getElementById("' + elementId + '").scrollIntoView(true);')
			$("$elementType", id:"$elementId")[index].click()
			return true
    }
 	//Use as InjectLibrary('https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js') to inject dependencies
    void InjectLibrary( String library ){
       def ok = browser.driver.executeScript("document.body.appendChild(document.createElement(\'script\')).src=\'$library\'")
    }
}
