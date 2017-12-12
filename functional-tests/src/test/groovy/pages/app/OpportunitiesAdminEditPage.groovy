package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.Keys
import extensions.AngularJSAware

class OpportunitiesAdminEditPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Opportunity: ") }

	static content = {
            deleteButton { $("a", "title":"Delete opportunity") } 
        }
    }