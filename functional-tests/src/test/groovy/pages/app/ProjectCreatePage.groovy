package pages.app
import geb.Page
import org.openqa.selenium.By

class ProjectCreatePage extends Page {
    static at = { title.startsWith("BCDevExchange - The BC Developer") }
    static url = "projectadmin/create"
	static content = {
        ProjectName(wait: 2) { $('input[data-automation-id ~= "text-project-name"]')}
        ShortDescription(wait: 2) { $('textarea[data-automation-id ~= "text-project-short-description"]') }
        Program(wait: 2) { $('select[data-automation-id ~= "select-project-program"]') }
        Github(wait: 2) { $('input[data-automation-id ~= "text-project-github"]')}
        Tags(wait: 2) { $('input[data-automation-id ~= "text-project-tags"]')}
        ActivityLevel(wait: 2) { $('input[data-automation-id ~= "text-project-activity-level"]') }
        DeleteButton(wait: 2) { $('a[data-automation-id ~= "button-project-delete"]') }
        SaveButton(wait: 2) { $('button[data-automation-id ~= "button-project-save"]') }            
        ProjectDescriptionBox(wait: 2) { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]')) }
    }
}
