package tech.scryme.app.ui.navigation

sealed class Screen(val route: String, val title: String) {
    object Splash : Screen("splash", "Splash")
    object Overview : Screen("overview", "Overview")
    object Login : Screen("login", "Login")
    object Tasks : Screen("tasks", "Tasks")
    object Schedule : Screen("schedule", "Schedule")
    object TaskDetails : Screen("tasks/details/{taskId}", "Task Details") {
        fun createRoute(taskId: String) = "tasks/details/$taskId"
    }
    object Admin : Screen("admin", "Admin Hub")
    object AdminTasks : Screen("admin/tasks", "Task Management")
    object Staff : Screen("staff", "Staff & Team")
    object StaffDetails : Screen("staff/{staffId}", "Staff Details") {
        fun createRoute(staffId: String) = "staff/$staffId"
    }
    object Sales : Screen("sales", "Sales & Analytics")
    object Finance : Screen("finance", "Finance & Expenses")
    object Branch : Screen("branch", "Branches")
    object BranchDetails : Screen("branch/{branchId}", "Branch Details") {
        fun createRoute(branchId: String) = "branch/$branchId"
    }
    object Customer : Screen("customer", "Customer Management")
    object CustomerDetails : Screen("customer/{customerId}", "Customer Details") {
        fun createRoute(customerId: String) = "customer/$customerId"
    }
    object Production : Screen("production", "Production")
    object Profile : Screen("profile", "Profile")
    object Settings : Screen("settings", "Settings")
    object Account : Screen("account", "Account & Profile")
    object NotificationSettings : Screen("notifications", "Notification Preferences")
    object Organization : Screen("organization", "Organization & Hardware")
}
