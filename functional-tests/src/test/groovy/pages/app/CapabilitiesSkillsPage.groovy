package pages.app
import geb.Page

class CapabilitiesSkillsPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "settings/skills"
	static content = {
        SkillList(wait: true) { $("div", 'data-automation-id': startsWith("ListCapabilitiesSection-")) }
        First_Skill(wait: true) { $("div", 'data-automation-id':"ListCapabilitiesSection-Cooking", 0) }
        SaveChangesButton(wait: true) { $("button", 'data-automation-id': "btnSaveChangesSkills")}
        ClaimCheckboxList(wait: true) { $("input", 'data-automation-id': startsWith('ckbClaimCapability-')) }
        ClaimCapabilityCheck(wait: true) { $("input", 'data-automation-id': "ckbClaimCapability-Cooking", 0) }
        PreferredTechSkill0(wait: true) { $("label", 'data-automation-id':"preferredTechSkill-chopping") }
        PreferredTechSkill1(wait: true) { $("label", 'data-automation-id':"preferredTechSkill-roasting") }
        PreferredTechSkill2(wait: true) { $("label", 'data-automation-id':"preferredTechSkill-butchering") }
    }
}
