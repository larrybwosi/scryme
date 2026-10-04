package tech.scryme.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.ui.auth.AuthViewModel
import tech.scryme.app.ui.navigation.AppNavGraph
import tech.scryme.app.ui.navigation.Screen
import tech.scryme.app.ui.theme.ScrymeTheme
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val themeMode by sessionManager.themeModeFlow.collectAsState(initial = "SYSTEM")
            ScrymeTheme(themeMode = themeMode) {
                MainAppScreen()
            }
        }
    }
}

@Composable
fun MainAppScreen(
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val navController = rememberNavController()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val bottomNavScreens = listOf(
        Screen.Tasks,
        Screen.Schedule,
        Screen.Admin,
        Screen.Branch,
        Screen.Profile,
        Screen.Settings
    )

    Scaffold(
        bottomBar = {
            if (isLoggedIn && currentRoute != Screen.Login.route) {
                NavigationBar {
                    bottomNavScreens.forEach { screen ->
                        val selected = currentRoute == screen.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            label = { Text(screen.title) },
                            icon = {
                                Text(
                                    text = when (screen) {
                                        Screen.Tasks -> "📋"
                                        Screen.Schedule -> "📅"
                                        Screen.Admin -> "⚡"
                                        Screen.Branch -> "🏢"
                                        Screen.Profile -> "👤"
                                        Screen.Settings -> "⚙️"
                                        else -> "•"
                                    }
                                )
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        AppNavGraph(
            navController = navController,
            startDestination = if (isLoggedIn) Screen.Tasks.route else Screen.Login.route,
            authViewModel = authViewModel,
            onLoginSuccess = {
                navController.navigate(Screen.Tasks.route) {
                    popUpTo(Screen.Login.route) { inclusive = true }
                }
            },
            onLogout = {
                navController.navigate(Screen.Login.route) {
                    popUpTo(0) { inclusive = true }
                }
            },
            modifier = Modifier.padding(innerPadding)
        )
    }
}
