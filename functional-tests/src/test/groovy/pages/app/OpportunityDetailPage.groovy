package pages.app

import geb.Page
import org.openqa.selenium.Keys
import extensions.AngularJSAware

class OpportunityDetailPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Opportunity:") }
    
    static content = {
    	unPublished { $("label.label-danger")[0].contains("UNPUBLISHED") }
		published {$("label.label-lg.label-success-o").contains("Published") } 
    	oppDetailTitle { $("h2").text() }
		//oppPublish_click { $("#page-top > main > ui-view > div > div:nth-child(2) > div > a") << Keys.chord(Keys.ENTER) }
		oppPublishclick { $("a", text: startsWith("Publish")) << Keys.chord(Keys.ENTER) }
		//oppPublishYes_click { $("#page-top > div.modal.fade.in > div > div > div.modal-footer > button.btn.btn-primary") << Keys.chord(Keys.ENTER) }
		oppubYesclick { $("button", text: startsWith("Yes")) << Keys.chord(Keys.ENTER) }
    }
}
