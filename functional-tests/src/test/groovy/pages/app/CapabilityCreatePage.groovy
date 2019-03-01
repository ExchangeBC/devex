package pages.app
import geb.Page
import org.openqa.selenium.By

class CapabilityCreatePage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "/capabilityadmin/create"
	static content = {
      CapabilityName{$("input",id:"name",placeholder:"e.g. Front-end Development")}
      CapabilityLabel{$("input",id:"name",placeholder:"e.g. label-frontend")}
      CapabilityDescription{$("input",'data-automation-id':"inputCapabilityDescription")}
      DescriptionBox{$(By.xpath('//div[@id="mceu_18"]//div[@id="mceu_18-body"]//div[@id="mceu_30"]//iframe[@id="ui-tinymce-1_ifr"]'))}
      SaveCapability{$("button", 'data-automation-id':"btnSaveCapability")}
      AddNewSkillText{$("input", 'data-automation-id':"addNewSkillText")}
      AddNewSkillBtn{$("button", 'data-automation-id':"btnAddNewSkill")}
  }
}
