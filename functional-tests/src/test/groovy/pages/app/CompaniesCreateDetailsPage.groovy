package pages.app
import geb.Page


class CompaniesCreateDetailsPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "orgs/create"
	static content = {

        BusinessInfoTab{$("uib-tab-heading",'data-automation-id':"businessInfoTab")}
            CompanyLegalName { $("input",id:"companyname") }
            DoingBusinessAs{$("input",id:"dba")}
            Address1{$("input",id:"address")}
            Address2{$("input",id:"address2")}
            City{$("input",id:"city")}
            Province{$("input",id:"province")}
            PostalCode{$("input",id:"postalcode")}
            BusinessNumber { $("input",id:"businessNumber") }
            Jurisdiction { $("input",id:"businessJurisdiction") }
            WebAddress{$("input",'data-automation-id':"companywebaddress")}

            ContactName{$("input",id:"contactName")}
            ContactPhone{$("input",id:"contactPhone")}
            ContactEmail{$("input",id:"contactEmail")}
        
        TeamMembersTab{$("uib-tab-heading",'data-automation-id':"teamMembersTab")}
            InviteTeamMembers{$("input",'data-automation-id':"inviteTeamMembers")}
            BtnSendInvitations{$("button",'data-automation-id':"btnSendInvitations")}


        TermsTab{$("uib-tab-heading",'data-automation-id':"termsTab")}
            CkbAckTermsCompany{$("input",'data-automation-id':"ckbAckTermsCompany")}
            LnkTermRFQ1{$("a",'data-automation-id':"lnkTermRFQ1")}
            BtnAckInvitationsSent{$("button",'data-automation-id':"btnAckInvitationsSent")}


        SaveCompanyButton{$("button",'data-automation-id':"saveCompanyChanges")}
        DeleteCompanyProfile{$("button",'data-automation-id':"deleteCompanyProfile")}





  }
}
