package pages.app
import geb.Page

class AdminUsersPage extends Page {
	static at = { title == "BCDevExchange - Users List" }
	static url = "admin/users"
	static content = {}
}
