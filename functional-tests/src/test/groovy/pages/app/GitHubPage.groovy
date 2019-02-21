package pages.app
import geb.Page

class GitHubPage extends Page  {
	//static at = { title == "GitHub" }
	static at = {title.contains("GitHub") } 
	static url = "https://github.com"
	static content = {

		AvatarImage{$("summary",'aria-label':"View profile and more",'data-ga-click':"Header, show menu, icon:avatar" )}
		SignOutGit {$("#user-links > li:nth-child(3) > details > details-menu > form > button")}
		        
	}
}




