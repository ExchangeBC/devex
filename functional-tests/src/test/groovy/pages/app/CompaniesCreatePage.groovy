package pages.app
import geb.Page


class CompaniesCreatePage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "orgs/create"
	static content = {
        CompanyName { $("input",id:"companyname") }
        Jurisdiction { $("input",id:"businessJurisdiction") }
        BusinessNumber { $("input",id:"businessNumber") }

        AgreeConditions{$("input",'data-automation-id':"AgreeCondCheckBox")}

        ContinueSubmitButton{$("button",'data-automation-id':"ContinueSubmitButton")}




  }
}
