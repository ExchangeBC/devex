package pages.app
import geb.Page
import geb.module.*
import org.openqa.selenium.By
import org.openqa.selenium.Keys
import geb.Browser
import extensions.AngularJSAware
import modules.CheckboxModule

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
           
            descriptionOppFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-cwu-description"]//@id,"_ifr")]'), 0) }
            //descriptionOppFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-cwu-description"]//@id,"ui-tinymce-4_ifr")]'), 0) }
/*[@id="ui-tinymce-4"]
//*[@id="ui-tinymce-4"]
//descriptionTextBox { $("textarea",id="ui-tinymce-7")}
//descriptionTextBox { $('#ui-tinymce-7')



<textarea name="description" id="ui-tinymce-7" data-automation-id="text-cwu-description" 
class="form-control ng-pristine ng-untouched ng-valid ng-scope ng-empty __WebInspectorHideElement__" 
ui-tinymce="vm.TINYMCE_OPTIONS" placeholder="A full description of the opportunity" 
ng-model="vm.opportunity.description" aria-hidden="true" style="display: none;">			</textarea>
*/

            evaluationFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-cwu-evaluation"]//@id,"_ifr")]'), 0) }

            acceptanceFrame(page: MCEFrame) { $(By.xpath('//iframe[@id=concat(//textarea[@data-automation-id="text-cwu-acceptance"]//@id,"_ifr")]'), 0) }

        
            SaveButton { $('button[data-automation-id ~= "button-cwu-save"]') }
            DeleteButton { $('a[data-automation-id ~= "button-cwu-delete"]') }
            
         selectProject { $('[id=project]') }


            oppTitle { $("input",id:"title") }

            
            oppTeaser { $("#short") }
           


            //oppEmail { $("input", id:"proposalEmail") }
            oppGithub { $("input",id:"github") }
            oppSkills { $("input", id:"skilllist") }
            
            

           // selectOnsite{$('input', name:'onsite').value('mixed')}
/*
        SelectOnSite (){
            $("form").onsite = "current"
            $("form").site == "current"


            }
*/

            //Location Drop Down list
            selectLocation(wait:true){$('select',name:'location')}
            //LocationSelectedText {selectLocation.find('option', value:selectLocation.value()).text()}

            //Fixed-Price Reward Drop down list
            selectEarn(wait:true){$('select', name:'earn')}

            //proposalDeadLine(wait: true) {$("input", type:"date", name:"deadline")}

            proposalDeadLine(wait: true) {$("input",id:"deadline") }
            proposalAssignment{$("input", type:"date", name:"assignment")}
            proposalStartDate{$('input[name="start"]')}
            //proposalStartDate{$("input", type:"date", name:"start")}
         }
            //<input type="date" id="start" name="start" class="form-control  ng-pristine ng-valid ng-not-empty ng-touched" ng-model="ngModel" style="">
//<input type="date" id="deadline" name="deadline" class="form-control  ng-pristine ng-valid ng-not-empty ng-touched" ng-model="ngModel" style="">

    void "selectOnsite"(String selectOption){
                def SelectOnsite=$(name:"onsite").module(RadioButtons)
                SelectOnsite.checked=selectOption
                }

    void "Add Description"(String desc){
            //waitFor { angularReady }
            withFrame( waitFor { descriptionOppFrame } ) {
              mceBody << desc
          }
    }
    









    void "Add Acceptance Criteria"(String desc){
            //waitFor { angularReady }
            withFrame( waitFor { acceptanceFrame } ) {
              mceBody << desc
          }
    }

    void "Add Proposal Criteria"(String desc){
            //waitFor { angularReady }
            withFrame( waitFor { evaluationFrame } ) {
              mceBody << desc
          }
    }
   
    void "Set All Dates"(){
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
