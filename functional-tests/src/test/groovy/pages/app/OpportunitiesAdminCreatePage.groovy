package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import geb.Browser
//import extensions.AngularJSAware
import modules.CheckboxModule
import modules.AngularValidated

//class OpportunitiesAdminCreatePage extends Page implements AngularJSAware {  
//	static at = { angularReady && title == "BCDevExchange - New Opportunity" }

class OpportunitiesAdminCreatePage extends Page {  
	static at = {title.startsWith("BCDevExchange - The BC Developer") } 
	//static url = "opportunityadmin/createcwu"
    static url = "createcwu"

	static content = {
        HeaderTabClick { $('[data-automation-id ~= "tab-cwu-header"]').click() }
        BackgroundTabClick { $('[data-automation-id ~= "tab-cwu-background"]').click() }
        AcceptanceTabClick { $('[data-automation-id ~= "tab-cwu-acceptance"]').click() }
        DetailsTabClick { $('[data-automation-id ~= "tab-cwu-details"]').click() }
           
        OppBackgroundBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),0)}
        OppAcceptanceBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),1)}
        ProposalAcceptanceBox{$(By.xpath('//iframe[@title="Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help"]'),2)}

        SaveButton { $('button[data-automation-id ~= "button-cwu-save"]') }
        DeleteButton { $('a[data-automation-id ~= "button-cwu-delete"]') }
            
        selectProject { $('[id=project]') }
        oppTitle { $("input",id:"title") }
        oppTeaser { $("#short") }
        //oppEmail { $("input", id:"proposalEmail") }
        oppGithub { $("input",id:"github") }
        oppSkills { $("input", id:"skilllist") }
        selectLocation(wait:true){$('select',name:'location')} //Location Drop Down list
        selectEarn(wait:true){$('select', name:'earn')}//Fixed-Price Reward Drop down list
        LocationRadioButton {option -> $("input[type='radio']", name: "onsite", value: option)}

        //Dates section
        proposalDeadLine(wait: true) {$("input",id:"deadline") }
        proposalAssignment{$("input", type:"date", name:"assignment")}
        proposalStartDate{$('input[name="start"]')}

        
            //proposalStartDate{$("input", type:"date", name:"start")}
         }
            //<input type="date" id="start" name="start" class="form-control  ng-pristine ng-valid ng-not-empty ng-touched" ng-model="ngModel" style="">
//<input type="date" id="deadline" name="deadline" class="form-control  ng-pristine ng-valid ng-not-empty ng-touched" ng-model="ngModel" style="">



/*
    void "selectOnsite"(String selectOption){
        def SelectOnsite=$(name:"onsite").module(RadioButtons)
        SelectOnsite.checked=selectOption
    }
*/
   
    void "Set All Dates"(){//CRC: I am setting the dates in the CreatePorgramProjectOpp script, so I do not use this function
        def dateFormat = 'yyyy-MM-dd'
        def deadline = new Date().plus('7')
        def assignment = new Date().plus('21')
        def start = new Date().plus('42')
        deadline = deadline.format( dateFormat )
        assignment = assignment.format( dateFormat )
        start = start.format( dateFormat )
        println deadline
        println assignment
        println start
        "Set Deadline Date"("$deadline")        
        "Set Assignment Date"("$assignment")        
        "Set Start Date"("$start")
    }

    void "Set Deadline Date"(String dDate){
        //waitFor { angularReady }
        $("input", type:"date", name:"deadline").jquery.val(dDate)
    }

    void "Set Assignment Date"(String dDate){
        //waitFor { angularReady }
        $("input", type:"date", name:"assignment").jquery.val(dDate)
    }

    void "Set Start Date"(String dDate){
        //waitFor { angularReady }
        $("input", type:"date", name:"start").jquery.val(dDate)
        }

}
