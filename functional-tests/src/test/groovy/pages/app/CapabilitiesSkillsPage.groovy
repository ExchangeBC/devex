package pages.app
import geb.Page



class CapabilitiesSkillsPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "settings/skills"
	static content = {

    
        First_Skill { $("div", 'data-automation-id':"ListCapabilitiesSection")}
       

        SaveChangesButton { $("button", 'data-automation-id': "btnSaveChangesSkills")}
        ClaimCapabilityCheck { $("input", 'data-automation-id': "ckbClaimCapability")}
        PreferredTechSkill0 {$("label", 'data-automation-id':"preferredTechSkill",0)}
        PreferredTechSkill1 {$("label", 'data-automation-id':"preferredTechSkill",1)}
        PreferredTechSkill2 {$("label", 'data-automation-id':"preferredTechSkill",2)}


    }
}
