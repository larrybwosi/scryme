package tech.scryme.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Storefront
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    101
                )
            }
        }

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
        Screen.Profile
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
                                val imageVector = when (screen) {
                                    Screen.Tasks -> Icons.AutoMirrored.Filled.Assignment
                                    Screen.Schedule -> Icons.Default.Event
                                    Screen.Admin -> Icons.Default.AdminPanelSettings
                                    Screen.Branch -> Icons.Default.Storefront
                                    Screen.Profile -> Icons.Default.Person
                                    else -> Icons.Default.Person
                                }
                                Icon(
                                    imageVector = imageVector,
                                    contentDescription = screen.title
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
