package pages.app
import geb.Page
import geb.module.*

class OpportunitiesAdminCreatePage extends Page {
	static at = { title == "BCDevExchange - New Opportunity" }
	static url = "opportunityadmin/create"
	static content = {
	        selectProject { $("#opportunityForm") }
	        oppTitle { $("input",id:"title") }
	        oppTeaser { $(name: "short").module(Textarea) }
	        desciFrame { $("iframe", id:"ui-tinymce-1_ifr") }
	        propiFrame { $("iframe", id:"ui-tinymce-3_ifr") }
	        aciFrame { $("iframe", id:"ui-tinymce-2_ifr") }
	        mceBody { $("body", id:"tinymce") }               
            oppGithub { $("input",id:"github") }
            selectLocation { $("#opportunityForm") }
            selectOnsite { $("#opportunityForm") }
            oppSkills { $("input", id:"skilllist") }
            selectEarn { $("#opportunityForm") }
            oppEmail { $("input", id:"proposalEmail") }
            // HTML5 Date fields that are non editable need jquery, note the format "yyyy-mm-dd"
            oppDeadline { $("input", name:"deadline").jquery }
            oppAssignment { $("input", name:"assignment").jquery }
            oppStart { $("input", name:"start").jquery }
            lowerSaveButton { $("#opportunityForm > div.row.form-foot > div > div > button") }
            upperSaveButton { $("#opportunityForm > div.row.form-head > div.col-md-6.col-form-buttons.text-right > div > button") }
	}

	 //Hard wait function, sometimes useful to sync up the application when you cannot use waitFor.
    void sleepForNSeconds(int n) {
    	def originalMilliseconds = System.currentTimeMillis()
    	waitFor(n + 1, 0.5) { (System.currentTimeMillis() - originalMilliseconds) > (n * 1000) }
    	}
}
