package pages.app
import geb.Page


class OrgDetailsPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }

	static content = {
            FindMembersInput { $("input",'data-automation-id':"findMembers") }

            AcceptButton{$("button",'data-automation-id':"btnAccept")}
            DeleteButton{$("button",'data-automation-id':"btnDelete")}

            EditButtonLeft{$("button",'data-automation-id':"btnEdit_left" )}
            EditButtonRight{$("button",'data-automation-id':"btnEdit_right" )}

            AddWebsite{$("a",'data-automation-id':"lnkAddWebsite")}
            BusinessRegistration{$("div",'data-automation-id':"lblBusinessRegistration")} //Note, this is a label, not an input entry field

            CompanyLegalName { $("input",id:"companyname") }
            CompanyWebAddress{$("input",'data-automation-id':"inpCompanyWebAddress")}
            SaveCompanyNameBtn{$("button",'data-automation-id':"btnSaveCompanyName" )}

            Address1{$("input",id:"address")}
            Address2{$("input",id:"address2")}
            City{$("input",id:"city")}
            Province{$("input",id:"province")}
            PostalCode{$("input",id:"postalcode")}

            BusinessNumber { $("input",id:"businessNumber") }//This is an input entry field
            Jurisdiction { $("input",id:"businessJurisdiction") }

            ContactName{$("input",id:"contactName")}
            ContactPhone{$("input",id:"contactPhone")}
            ContactEmail{$("input",id:"contactEmail")}

            SaveCompanyOtherInformationBtn{$("button",'data-automation-id':"btnSaveCompanyOtherInformation" )}



    }
}
