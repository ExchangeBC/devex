package pages.app
import geb.Page

class CapabilitiesSkillsPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "settings/skills"
	static content = {
        First_Skill { $("div", 'data-automation-id':"ListCapabilitiesSection-Cooking", 0)}
        SaveChangesButton { $("button", 'data-automation-id': "btnSaveChangesSkills")}
        ClaimCapabilityCheck { $("input", 'data-automation-id': "ckbClaimCapability-Cooking", 0)}
        PreferredTechSkill0 {$("label", 'data-automation-id':"preferredTechSkill-chopping")}
        PreferredTechSkill1 {$("label", 'data-automation-id':"preferredTechSkill-roasting")}
        PreferredTechSkill2 {$("label", 'data-automation-id':"preferredTechSkill-butchering")}
    }
}
