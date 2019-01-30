package pages.app
import geb.Page
import org.openqa.selenium.By
//import extensions.AngularJSAware

//class ProgramViewPage extends Page implements AngularJSAware {
class ProgramViewPage extends Page {    
	//static at = { angularReady && title.startsWith("BCDevExchange - The BC Developer") }
    static at = { title.startsWith("BCDevExchange - The BC Developer") }
	//static url = "programs/pro-fads"
    static url = "programs/pro-sdfs"
	static content = {
        //PublishButton { $('a[data-automation-id ~= "button-program-publish"]') }  

        //PublishButton { $("a", (data-automation-id):"button-program-publish") } 

 PublishButton { $('a',title:"Publish this program page") } 

        EditButton { $('button[data-automation-id ~= "button-program-edit"]') }

        UnpublishButton { $('a[data-automation-id ~= "button-program-unpublish"]') }
        RequestMembershipButton { $('button[data-automation-id ~= "button-program-request-membership"]') }
    }
}



//<a data-automation-id="button-program-publish" href="unsafe:javascript:void(0);" ng-if="vm.canEdit &amp;&amp; !vm.program.isPublished" class="btn btn-primary ng-scope" ng-click="vm.publish(true)" title="Publish this program page">Publish</a>
