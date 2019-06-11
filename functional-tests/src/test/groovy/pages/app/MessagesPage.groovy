package pages.app
import geb.Page

class MessagesPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "settings/messages"
	static content = {
        AvatarImage(wait: true) { $("img",'data-automation-id':"UserAvatarImage" ) }
        BtnAccept(wait: true) { $("button",'data-automation-id':"btnMessage",0) }
        BtnDecline(wait: true) { $("button",'data-automation-id':"btnMessage",1) }
        UnreadMessageIcon(wait: true) { $("span",'data-automation-id':"unreadMessageIcon") }
        ProcessUserRequest(wait: true) { $("a",'data-automation-id':"processUserRequest",0) }
        NewCompanyMenuItem(wait: true) { $("a", text: contains("Hugo and friend\'s Company")) }
    }
}
