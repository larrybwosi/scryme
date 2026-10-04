package tech.scryme.app.ui.navigation

sealed class Screen(val route: String, val title: String) {
    object Login : Screen("login", "Login")
    object Tasks : Screen("tasks", "My Tasks")
    object Schedule : Screen("schedule", "My Schedule")
    object Admin : Screen("admin", "Admin Hub")
    object Branch : Screen("branch", "Branches")
    object Profile : Screen("profile", "Profile")
    object Settings : Screen("settings", "Settings")
}
