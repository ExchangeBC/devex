package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import geb.Browser
import geb.module.RadioButtons
import modules.CheckboxModule
import modules.AngularValidated

class OpportunitiesAdminCreateSWUPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer") }
    static url = "createswu"

	static content = {
        // Tabs
        HeaderTab(wait: true) { $('[data-automation-id ~= "tabHeader"]') }
        BackgroundTab(wait: true) { $('[data-automation-id ~= "tabBackground"]') }
        DetailsTab(wait: true) { $('[data-automation-id ~= "tabDetails"]') }
        PhasesTab(wait: true) { $('[data-automation-id ~= "tabPhases"]') }
        TechnicalSkillTab(wait: true) { $('[data-automation-id ~= "tabTechnicalSkills"]') }
        BudgetTab(wait: true) { $('[data-automation-id ~= "tabBudget"]') }
        TermsTab(wait: true) { $('[data-automation-id ~= "tabTerms"]') }
        QuestionsTab(wait: true) { $('[data-automation-id ~= "tabQuestions"]') }
        AddendaTab(wait: true) { $('[data-automation-id ~= "tabAddenda"]') }
        ScoringTab(wait: true) { $('[data-automation-id ~= "tabScoring"]') }

        // Header tab objects
        ProjectSelector(wait: true)  { $('[id=project]') }
        OppTitleTextInput(wait: true)  { $("input",id:"title") }
        OppTeaserInput(wait: true)  { $("#short") }
        OppGithubInput(wait: true)  { $("input",id:"github") }

        // Background tab objects
        OppBackgroundBox { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'), 0) }

        // Details tab objects
        LocationRadioButton(wait: true) { option -> $("input[type='radio']", name: "onsite", value: option) }
        LocationSelector(wait:true) { $('select',name:'location') }
        
        // Dates in Details tab
        ProposalDeadlineInput(wait: true) { $("input",id:"deadline") }
        ProposalAssignmentInput(wait: true) { $("input", type:"date", name:"assignment") }

        // Phases tab objects
        CapabilityInceptionBtn(wait: true) { $("button",'data-automation-id':"btnInception") }
        CapabilityProofOfConceptBtn(wait: true) { $("button",'data-automation-id':"btnProofOfConcept") }
        CapabilityImplementationBtn(wait: true) { $("button",'data-automation-id':"btnImplementation") }

        CapabilityInceptionTgl(wait: true) { $("li",'data-automation-id':"tglCapabilityInception") }
        CapabilityProofOfConceptTgl(wait: true) { $("li",'data-automation-id':"tglCapabilityProofOfConcept") }
        CapabilityImplementationTgl(wait: true) { $("li",'data-automation-id':"tglCapabilityImplementation") }

        // Dates in Phases tab --- there are problems with the ids of the diferent elements. This section will need more work
        InceptionStartDate(wait: true) { $("input",id:"inceptionStartDate") }
        InceptionCompleteDate(wait: true) { $("input",id:"inceptionCompleteDate") }
        PrototypeStartDate(wait: true) { $("input",id:"prototypeStartDate") }
        PrototypeEndDate(wait: true) { $("input",id:"prototypeEndDate") }
        ImplementationStartDate(wait: true) { $("input",id:"implementationStartDate") }
        ImplementationEndDate(wait: true) { $("input",id:"implementationEndDate") }
        
        // Preferred Technical Skills tab objects
        Skill0(wait: true) { $("label",'data-automation-id':"lstSkills",0) }
        Skill1(wait: true) { $("label",'data-automation-id':"lstSkills",1) }
        Skill2(wait: true) { $("label",'data-automation-id':"lstSkills",2) }

        // Budget tab objects
        MaxBudgetTotal(wait: true) { $("input",id:"budget") }
        MaxBudgetInception(required: false, wait: true) { $("input",id:"incBudget") }
        MaxBudgetPOC(required: false, wait: true) { $("input",id:"proofBudget") }
        MaxBudgetImplementation(wait: true) { $("input",id:"implBudget") }

        // Terms and conditions tab objects
        AdditionalTermsBox(wait: true) { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),1) }
        ConflictOfInterestCkb(wait: true) { $("input",type:"checkbox", name:"isInception").module(Checkbox) }
        DocNonDisclosureCkb(wait: true) { $("input",type:"checkbox", name:"isPrototype").module(Checkbox) }
        RequestForReferencesCkb(wait: true) { $("input",type:"checkbox", name:"isImplementation").module(Checkbox) }

        // Team Questions tab objects
        AddNewQuestionBtn(wait: true) { $("button",'data-automation-id':"btnAddNewQuestion") }
        QuestionBox(wait: true) { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),2) }

        // Addenda tab objects
        AddAddAddenda(wait: true) { $("button",'data-automation-id':"btnAddAddenda") }
        AddendaBox(wait: true) { $(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),4) }

        // Scoring Tab objects
        SkillScore(wait: true) { $("input",'data-automation-id':"skillScore") }
        TeamQuestionScore(wait: true) { $("input",'data-automation-id':"teamQuestionScore") }
        CodeChallengeScore(wait: true) { $("input",'data-automation-id':"codeChallengeScore") }
        TeamScenarioScore(wait: true) { $("input",'data-automation-id':"teamScenarioScore") }
        PriceScore(wait: true) { $("input",'data-automation-id':"priceScore") }
        SaveButton(wait: true) { $('button[data-automation-id ~= "btnSaveChanges"]') }
        DeleteButton(wait: true) { $('a[data-automation-id ~= "button-cwu-delete"]') }
    }
}
