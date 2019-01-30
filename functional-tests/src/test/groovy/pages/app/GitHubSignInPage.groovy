package pages.app
import geb.Page

class GitHubSignInPage extends Page  {
	static at = { title.startsWith( "Sign in to GitHub")}
	static content = {

        GitHubSignInButton{$("input", name:"commit" )}
		GitHubLogin{$(id:"login_field")}
		GitHubPwd{$(id:"password")}
		        
	}
}
