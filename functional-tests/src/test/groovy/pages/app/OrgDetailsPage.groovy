package pages.app
import geb.Page

class OrgDetailsPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }

	static content = {
            FindMembersInput(wait: true) { $("input",'data-automation-id':"findMembers") }

            AcceptButton(wait: true) { $("button",'data-automation-id':"btnAccept") }
            DeleteButton(wait: true) { $("button",'data-automation-id':"btnDelete") }

            EditButtonLeft(wait: true) { $("button",'data-automation-id':"btnEdit_left" ) }
            EditButtonRight(wait: true) { $("button",'data-automation-id':"btnEdit_right" ) }

            AddWebsite(wait: true) { $("a",'data-automation-id':"lnkAddWebsite") }
            BusinessRegistration(wait: true) { $("div",'data-automation-id':"lblBusinessRegistration") }

            CompanyLegalName(wait: true) { $("input",id:"companyname") }
            CompanyWebAddress(wait: true) { $("input",'data-automation-id':"inpCompanyWebAddress") }
            SaveCompanyNameBtn(wait: true) { $("button",'data-automation-id':"btnSaveCompanyName" ) }

            Address1(wait: true) { $("input",id:"address") }
            Address2(wait: true) { $("input",id:"address2") }
            City(wait: true) { $("input",id:"city") }
            Province(wait: true) { $("input",id:"province") }
            PostalCode(wait: true) { $("input",id:"postalcode") }

            BusinessNumber(wait: true) { $("input",id:"businessNumber") }
            Jurisdiction(wait: true) { $("input",id:"businessJurisdiction") }

            ContactName(wait: true) { $("input",id:"contactName") }
            ContactPhone(wait: true) { $("input",id:"contactPhone") }
            ContactEmail(wait: true) { $("input",id:"contactEmail") }

            SaveCompanyOtherInformationBtn(wait: true) { $("button",'data-automation-id':"btnSaveCompanyOtherInformation" ) }
    }
}
