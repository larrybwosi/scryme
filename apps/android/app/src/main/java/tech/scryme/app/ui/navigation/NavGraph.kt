package tech.scryme.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import tech.scryme.app.ui.admin.AdminScreen
import tech.scryme.app.ui.admin.AdminViewModel
import tech.scryme.app.ui.auth.AuthScreen
import tech.scryme.app.ui.auth.AuthViewModel
import tech.scryme.app.ui.branch.BranchScreen
import tech.scryme.app.ui.branch.BranchViewModel
import tech.scryme.app.ui.profile.ProfileScreen
import tech.scryme.app.ui.profile.ProfileViewModel
import tech.scryme.app.ui.schedule.ScheduleScreen
import tech.scryme.app.ui.schedule.ScheduleViewModel
import tech.scryme.app.ui.settings.SettingsScreen
import tech.scryme.app.ui.settings.SettingsViewModel
import tech.scryme.app.ui.tasks.TasksScreen
import tech.scryme.app.ui.tasks.TasksViewModel

@Composable
fun AppNavGraph(
    navController: NavHostController,
    startDestination: String,
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
        composable(Screen.Login.route) {
            AuthScreen(
                viewModel = authViewModel,
                onLoginSuccess = onLoginSuccess
            )
        }
        composable(Screen.Tasks.route) {
            val viewModel: TasksViewModel = hiltViewModel()
            TasksScreen(viewModel = viewModel)
        }
        composable(Screen.Schedule.route) {
            val viewModel: ScheduleViewModel = hiltViewModel()
            ScheduleScreen(viewModel = viewModel)
        }
        composable(Screen.Admin.route) {
            val viewModel: AdminViewModel = hiltViewModel()
            AdminScreen(viewModel = viewModel)
        }
        composable(Screen.Branch.route) {
            val viewModel: BranchViewModel = hiltViewModel()
            BranchScreen(viewModel = viewModel)
        }
        composable(Screen.Profile.route) {
            val viewModel: ProfileViewModel = hiltViewModel()
            ProfileScreen(
                viewModel = viewModel,
                onLogout = {
                    authViewModel.logout()
                    onLogout()
                }
            )
        }
        composable(Screen.Settings.route) {
            val viewModel: SettingsViewModel = hiltViewModel()
            SettingsScreen(
                viewModel = viewModel,
                onLogout = {
                    authViewModel.logout()
                    onLogout()
                }
            )
        }
    }
}
