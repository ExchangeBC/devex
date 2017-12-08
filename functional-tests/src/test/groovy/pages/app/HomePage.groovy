package pages.app
import geb.Page
import modules.LoginModule
import extensions.AngularJSAware

class HomePage extends Page implements AngularJSAware {
    
	static at = { angularReady && title == "BCDevExchange" }
    static url = ""
    static content = {
        login { module LoginModule  }
        
        //Links
        AboutLink { PositionAndClick("a","about") }
		AccessibilityLink { PositionAndClick("a","accessibility") }
		CodewithusLink { PositionAndClick("a","codewithus") }
		CopyrightLink { PositionAndClick("a","copyright") }
		DisclaimerLink { PositionAndClick("a","disclaimer") }
		PrivacyLink { PositionAndClick("a","privacy") }
		RoadmapLink { PositionAndClick("a","roadmap") }
		SigninadminLink { PositionAndClick("a","authentication.signinadmin") }
		OpportunitiesMenuLink { PositionAndClick("a","opportunities.list") }
		ProjectsLink { PositionAndClick("a","projects.list") }
		ProgramsLink { PositionAndClick("a","programs.list") }
		SigninLink { PositionAndClick("a","authentication.signin") }
		SignUpMidPageLink { PositionAndClick("a","authentication.gov",1) }
		OrgsList { PositionAndClick("a","orgs.list") }
		
// Folowing links are not yet operational
		LearnMoreLink { $("a", href:"/codewithus") }
		AboutMidPageLink { $("a", text:"Learn More") }
		AdminGovsLink { $() } //Admin
		AdminNotifymeetsLink { $() } //Admin
		AdminNotifyoppsLink { $() } //Admin
		AdminUsersLink { $() } //Admin
		ApiAuthSignoutLink { $() }
		NotificationsLink { $() } //Admin
		ProfilesLink { PositionAndClick("a","profiles.list") }
		ProposalsLink { $("a", "ui-sref":"proposals.list({})") }
		SettingsPictureLink { $() } //Admin
		SettingsProfileLink { $() } //Admin
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
