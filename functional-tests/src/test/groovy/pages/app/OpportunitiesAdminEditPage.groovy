package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.Keys
import extensions.AngularJSAware

class OpportunitiesAdminEditPage extends Page implements AngularJSAware {
	static at = { angularReady && title.startsWith("BCDevExchange - Opportunity: ") }
    //static at = { title.startsWith("BCDevExchange - Opportunity: ") }
	//static url = "opportunityadmin/create"
	static content = {
            deleteButton { $('#opportunityForm > div.row.form-head > div.col-md-6.col-form-buttons.text-right > div > a:nth-child(3)') }
            //deleteButton { $("a", title:"Remove", 0..1) }
        }
    }