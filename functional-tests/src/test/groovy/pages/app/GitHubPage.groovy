package pages.app
import geb.Page

class GitHubPage extends Page  {
	static at = {title.contains("GitHub") } 
	static url = "https://github.com"
	static content = {
		AvatarImage(wait: true) { $("summary", 'data-ga-click': "Header, show menu, icon:avatar") }
		SignOutGit(wait: true) { $("details > details-menu > form > button", 'data-ga-click':"Header, sign out, icon:logout") }
	}
}
