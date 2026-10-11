package tech.scryme.app.ui.navigation

sealed class Screen(val route: String, val title: String) {
    object Login : Screen("login", "Login")
    object Tasks : Screen("tasks", "Tasks")
    object Schedule : Screen("schedule", "Schedule")
    object Admin : Screen("admin", "Admin Hub")
    object Sales : Screen("sales", "Sales & Analytics")
    object Branch : Screen("branch", "Branches")
    object Profile : Screen("profile", "Profile")
    object Settings : Screen("settings", "Settings")
}
