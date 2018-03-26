package pages.app

import geb.Page
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import extensions.AngularJSAware

class OpportunityDetailPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Opportunity:") }
    
    static content = {
    	unPublished { $("label.label-danger")[0].contains("UNPUBLISHED") }
		published {$("label.label-lg.label-success-o").contains("Published") } 
    	oppDetailTitle { $("h2").text() }
		oppPublishclick { $(By.xpath('//a[contains(.,"PUBLISH") and i[@class[contains(.,"fa-bullhorn")]]]'), 0).click() }
		oppubYesclick { $("button", text: startsWith("Yes")) << Keys.chord(Keys.ENTER) }
    }
}
