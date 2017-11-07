package pages.app
import geb.Page
import modules.LoginModule

class HomePage extends Page {
    
    static at = { title == "BCDevExchange"}
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
		SignUpMidPageLink { PositionAndClick("a","authentication.gov") }
		AboutMidPageLink { $("a", text:"Learn More") }
		LearnMoreLink { $("a", href:"/codewithus") }


		AdminGovsLink { $() } //Admin
		AdminNotifymeetsLink { $() } //Admin
		AdminNotifyoppsLink { $() } //Admin
		AdminUsersLink { $() } //Admin
		ApiAuthSignoutLink { $() }
		 //Goes to codewithusPage
		NotificationsLink { $() } //Admin
		ProfilesLink { PositionAndClick("a","profiles.list") }
		ProposalsLink { $("a", "ui-sref":"proposals.list({})") }

		SettingsPictureLink { $() } //Admin
		SettingsProfileLink { $() } //Admin
    }

    Boolean PositionAndClick(String elementType, String elementId){
    		js.exec('document.getElementById("' + elementId + '").scrollIntoView(true);')
			$("$elementType", id:"$elementId")[0].click()
			return true
    }
}
