package pages.app

import geb.Page
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import extensions.AngularJSAware

class OpportunityDetailPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Opportunity:") }
    
    static content = {
      unPublished { $('[data-automation-id ~= "button-opportunity-publish]').isDisplayed() }
		  published { $('[data-automation-id ~= "button-opportunity-unpublish]').isDisplayed() } 
      oppDetailTitle { $('[data-automation-id ~= "text-opportunity-name"]').text() }
		  oppPublishClick { $('[data-automation-id ~= "button-opportunity-publish"]').click()  }
		  oppubYesClick { $("button", text: startsWith("Yes")) << Keys.chord(Keys.ENTER) }
    }
}
