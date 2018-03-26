package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import extensions.AngularJSAware

class OpportunitiesAdminEditPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Opportunity: ") }

	static content = {
            deleteButton { $(By.xpath('//a[@title="Remove" and contains(., "Delete this Opportunity")]'), 0) } 
        }
    }
