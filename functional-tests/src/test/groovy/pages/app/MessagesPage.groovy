package pages.app
import geb.Page

class MessagesPage extends Page {
	static at = { title.startsWith("BCDevExchange - The BC Developer\'s Exchange") }
	static url = "settings/messages"
	static content = {
        AvatarImage{$("img",'data-automation-id':"UserAvatarImage" )}
        BtnAccept{$("button",'data-automation-id':"btnMessage",0)}
        BtnDecline{$("button",'data-automation-id':"btnMessage",1)}
        UnreadMessageIcon{$("span",'data-automation-id':"unreadMessageIcon")}//Actually this is part of the header and perhaps should move to a module
        ProcessUserRequest{$("a",'data-automation-id':"processUserRequest",0)}
    }
}
