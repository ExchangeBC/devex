package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import geb.Browser
//import extensions.AngularJSAware
import geb.module.RadioButtons
import modules.CheckboxModule
import modules.AngularValidated

//class OpportunitiesAdminCreatePage extends Page implements AngularJSAware {
//	static at = { angularReady && title == "BCDevExchange - New Opportunity" }

class OpportunitiesAdminCreateSWUPage extends Page {
	static at = {title.startsWith("BCDevExchange - The BC Developer") }
	//static url = "opportunityadmin/createcwu"
    static url = "createswu"

	static content = {
        //Tabs
        HeaderTabClick { $('[data-automation-id ~= "tabHeader"]').click() }
        BackgroundTabClick { $('[data-automation-id ~= "tabBackground"]').click() }
        DetailsTabClick { $('[data-automation-id ~= "tabDetails"]').click() }
        PhasesTabClick{ $('[data-automation-id ~= "tabPhases"]').click() }
        TechnicalSkillTabClick{ $('[data-automation-id ~= "tabTechnicalSkills"]').click() }
        BudgetTabClick{ $('[data-automation-id ~= "tabBudget"]').click() }
        TermsTabClick{ $('[data-automation-id ~= "tabTerms"]').click() }
        QuestionsTabClick{ $('[data-automation-id ~= "tabQuestions"]').click() }
        AddendaTabClick{ $('[data-automation-id ~= "tabAddenda"]').click() }
        ScoringTabClick{ $('[data-automation-id ~= "tabScoring"]').click() }

        //Header tab objects
        selectProject { $('[id=project]') }
        oppTitle { $("input",id:"title") }
        oppTeaser { $("#short") }
        //oppEmail { $("input", id:"proposalEmail") }
        oppGithub { $("input",id:"github") }

        //Background tab objects
        OppBackgroundBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),0)}

        //Details tab objects
        LocationRadioButton {option -> $("input[type='radio']", name: "onsite", value: option)}
        selectLocation(wait:true){$('select',name:'location')} //Location Drop Down list
            //Dates in Details tab
            proposalDeadLine{$("input",id:"deadline") }
            proposalAssignment{$("input", type:"date", name:"assignment")}

        //Phases tab objects
        CapabilityInceptionBtn{$("button",'data-automation-id':"btnInception")}
        CapabilityProofOfConceptBtn{$("button",'data-automation-id':"btnProofOfConcept")}
        CapabilityImplementationBtn{$("button",'data-automation-id':"btnImplementation")}

        CapabilityInceptionTgl{$("li",'data-automation-id':"tglCapabilityInception")}
        CapabilityProofOfConceptTgl{$("li",'data-automation-id':"tglCapabilityProofOfConcept")}
        CapabilityImplementationTgl{$("li",'data-automation-id':"tglCapabilityImplementation")}

                //Dates in Phases tab --- there are problems with the ids of the diferent elements. This section will need more work
                InceptionStartDate(wait: true) {$("input",id:"inceptionStartDate") }
                InceptionCompleteDate(wait: true) {$("input",id:"inceptionCompleteDate") }

                PrototypeStartDate(wait: true) {$("input",id:"prototypeStartDate") }
                PrototypeEndDate(wait: true) {$("input",id:"prototypeEndDate") }

                ImplementationStartDate(wait: true) {$("input",id:"implementationStartDate") }
                ImplementationEndDate(wait: true) {$("input",id:"implementationEndDate") }
         

        //Preferred Technical Skills tab objects
        Skill0{$("label",'data-automation-id':"lstSkills",0)}
        Skill1{$("label",'data-automation-id':"lstSkills",1)}
        Skill2{$("label",'data-automation-id':"lstSkills",2)}

        //Budget tab objects
        MaxBudgetTotal{$("input",id:"budget")}
        MaxBudgetInception(required: false, wait: 2) {$("input",id:"incBudget")}
        MaxBudgetPOC(required: false, wait: 2) {$("input",id:"proofBudget")}
        MaxBudgetImplementation{$("input",id:"implBudget")}


        //Terms and conditions tab objects
        AdditionalTermsBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),1)}
        ConflictOfInterestCkb{$("input",type:"checkbox", name:"isInception").module(Checkbox)}
        DocNonDisclosureCkb{$("input",type:"checkbox", name:"isPrototype").module(Checkbox)}
        RequestForReferencesCkb{$("input",type:"checkbox", name:"isImplementation").module(Checkbox)}

        //Team Questions tab objects
        AddNewQuestionBtn{$("button",'data-automation-id':"btnAddNewQuestion")}
        QuestionBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),2)}

        //Addenda tab objects
        AddAddAddenda{$("button",'data-automation-id':"btnAddAddenda")}
        AddendaBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),4)}

        //Scoring Tab objects
        SkillScore{$("input",'data-automation-id':"skillScore")}
        TeamQuestionScore{$("input",'data-automation-id':"teamQuestionScore")}
        CodeChallengeScore{$("input",'data-automation-id':"codeChallengeScore")}
        TeamScenarioScore{$("input",'data-automation-id':"teamScenarioScore")}
        PriceScore{$("input",'data-automation-id':"priceScore")}


        SaveButton { $('button[data-automation-id ~= "btnSaveChanges"]') }
        DeleteButton { $('a[data-automation-id ~= "button-cwu-delete"]') }

    }


}
