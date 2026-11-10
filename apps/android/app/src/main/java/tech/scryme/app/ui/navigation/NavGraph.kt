package tech.scryme.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import tech.scryme.app.ui.account.AccountScreen
import tech.scryme.app.ui.account.AccountViewModel
import tech.scryme.app.ui.admin.AdminScreen
import tech.scryme.app.ui.admin.AdminViewModel
import tech.scryme.app.ui.auth.AuthScreen
import tech.scryme.app.ui.auth.AuthViewModel
import tech.scryme.app.ui.branch.BranchDetailsScreen
import tech.scryme.app.ui.branch.BranchDetailsViewModel
import tech.scryme.app.ui.branch.BranchScreen
import tech.scryme.app.ui.branch.BranchViewModel
import tech.scryme.app.ui.customer.CustomerDetailsScreen
import tech.scryme.app.ui.customer.CustomerDetailsViewModel
import tech.scryme.app.ui.customer.CustomerScreen
import tech.scryme.app.ui.customer.CustomerViewModel
import tech.scryme.app.ui.notifications.NotificationSettingsScreen
import tech.scryme.app.ui.notifications.NotificationSettingsViewModel
import tech.scryme.app.ui.organization.OrganizationScreen
import tech.scryme.app.ui.organization.OrganizationViewModel
import tech.scryme.app.ui.overview.OverviewScreen
import tech.scryme.app.ui.overview.OverviewViewModel
import tech.scryme.app.ui.production.ProductionScreen
import tech.scryme.app.ui.production.ProductionViewModel
import tech.scryme.app.ui.profile.ProfileScreen
import tech.scryme.app.ui.profile.ProfileViewModel
import tech.scryme.app.ui.sales.SalesScreen
import tech.scryme.app.ui.sales.SalesViewModel
import tech.scryme.app.ui.schedule.ScheduleScreen
import tech.scryme.app.ui.schedule.ScheduleViewModel
import tech.scryme.app.ui.schedule.TaskDetailsScreen
import tech.scryme.app.ui.schedule.TaskDetailsViewModel
import tech.scryme.app.ui.settings.SettingsScreen
import tech.scryme.app.ui.settings.SettingsViewModel
import tech.scryme.app.ui.splash.SplashScreen
import tech.scryme.app.ui.splash.SplashViewModel
import tech.scryme.app.ui.tasks.TasksScreen
import tech.scryme.app.ui.tasks.TasksViewModel

@Composable
fun AppNavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Splash.route,
    authViewModel: AuthViewModel = hiltViewModel(),
    onLoginSuccess: () -> Unit,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        composable(Screen.Splash.route) {
            val viewModel: SplashViewModel = hiltViewModel()
            SplashScreen(
                viewModel = viewModel,
                onNavigateToOverview = {
                    navController.navigate(Screen.Overview.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Login.route) {
            AuthScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    onLoginSuccess()
                    navController.navigate(Screen.Overview.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Overview.route) {
            val viewModel: OverviewViewModel = hiltViewModel()
            OverviewScreen(
                viewModel = viewModel,
                onNavigateToSchedule = { navController.navigate(Screen.Schedule.route) },
                onNavigateToTasks = { navController.navigate(Screen.Tasks.route) },
                onNavigateToAdminAnalytics = { navController.navigate(Screen.Sales.route) }
            )
        }
        composable(Screen.Tasks.route) {
            val viewModel: TasksViewModel = hiltViewModel()
            TasksScreen(
                viewModel = viewModel,
                onNavigateToTaskDetails = { taskId ->
                    navController.navigate(Screen.TaskDetails.createRoute(taskId))
                }
            )
        }
        composable(Screen.Schedule.route) {
            val viewModel: ScheduleViewModel = hiltViewModel()
            ScheduleScreen(
                viewModel = viewModel,
                onNavigateToTaskDetails = { taskId ->
                    navController.navigate(Screen.TaskDetails.createRoute(taskId))
                }
            )
        }
        composable(
            route = Screen.TaskDetails.route,
            arguments = listOf(navArgument("taskId") { type = NavType.StringType })
        ) {
            val viewModel: TaskDetailsViewModel = hiltViewModel()
            TaskDetailsScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Admin.route) {
            val viewModel: AdminViewModel = hiltViewModel()
            AdminScreen(
                viewModel = viewModel,
                onNavigateToSales = { navController.navigate(Screen.Sales.route) },
                onNavigateToBranches = { navController.navigate(Screen.Branch.route) },
                onNavigateToCustomers = { navController.navigate(Screen.Customer.route) },
                onNavigateToProduction = { navController.navigate(Screen.Production.route) }
            )
        }
        composable(Screen.Production.route) {
            val viewModel: ProductionViewModel = hiltViewModel()
            ProductionScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Sales.route) {
            val viewModel: SalesViewModel = hiltViewModel()
            SalesScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Branch.route) {
            val viewModel: BranchViewModel = hiltViewModel()
            BranchScreen(
                viewModel = viewModel,
                onNavigateToBranchDetails = { branchId ->
                    navController.navigate(Screen.BranchDetails.createRoute(branchId))
                }
            )
        }
        composable(
            route = Screen.BranchDetails.route,
            arguments = listOf(navArgument("branchId") { type = NavType.StringType })
        ) {
            val viewModel: BranchDetailsViewModel = hiltViewModel()
            BranchDetailsScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Customer.route) {
            val viewModel: CustomerViewModel = hiltViewModel()
            CustomerScreen(
                viewModel = viewModel,
                onNavigateToCustomerDetails = { customerId ->
                    navController.navigate(Screen.CustomerDetails.createRoute(customerId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(
            route = Screen.CustomerDetails.route,
            arguments = listOf(navArgument("customerId") { type = NavType.StringType })
        ) {
            val viewModel: CustomerDetailsViewModel = hiltViewModel()
            CustomerDetailsScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Profile.route) {
            val viewModel: ProfileViewModel = hiltViewModel()
            ProfileScreen(
                viewModel = viewModel,
                onNavigateToAccount = { navController.navigate(Screen.Account.route) },
                onNavigateToOrganization = { navController.navigate(Screen.Organization.route) },
                onNavigateToNotifications = { navController.navigate(Screen.NotificationSettings.route) },
                onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                onLogout = {
                    authViewModel.logout()
                    onLogout()
                }
            )
        }
        composable(Screen.Account.route) {
            val viewModel: AccountViewModel = hiltViewModel()
            AccountScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.NotificationSettings.route) {
            val viewModel: NotificationSettingsViewModel = hiltViewModel()
            NotificationSettingsScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Organization.route) {
            val viewModel: OrganizationViewModel = hiltViewModel()
            OrganizationScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Settings.route) {
            val viewModel: SettingsViewModel = hiltViewModel()
            SettingsScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() },
                onLogout = {
                    authViewModel.logout()
                    onLogout()
                }
            )
        }
    }
}
