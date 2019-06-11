package pages.app
import geb.Page
import org.openqa.selenium.By

class ProgramCreatePage extends Page  {

  static at = { title.startsWith("BCDevExchange - The BC Developer")}
	static url = "programadmin/create"
	
  static content = {
    ProgramTitle(wait: 2) { $('input[data-automation-id ~= "text-program-title"]') }
    ShortDescription(wait: 2) { $('textarea[data-automation-id ~= "text-program-short-description"]') }
    Website(wait: 2) { $('input[data-automation-id ~= "text-program-website"]')}
    SaveButton(wait: 2) { $('a[data-automation-id ~= "button-program-save"]') }
    DeleteButton(wait: 2) { $('a[data-automation-id ~= "button-program-delete"]') }
    ProgramDescriptionBox(wait: 2) { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]')) }
  }
}
