package tech.scryme.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material.icons.filled.TaskAlt
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material.icons.outlined.TaskAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var sessionManager: SessionManager

    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        handleIntent(intent)

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
                MainAppScreen(authViewModel = authViewModel)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val action = intent?.action
        val data = intent?.data
        if (Intent.ACTION_VIEW == action && data != null) {
            authViewModel.handleDeepLinkIntent(data)
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
                CompactEnterpriseBottomBar(
                    screens = bottomNavScreens,
                    currentRoute = currentRoute,
                    onNavigate = { screen ->
                        navController.navigate(screen.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
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

@Composable
fun CompactEnterpriseBottomBar(
    screens: List<Screen>,
    currentRoute: String?,
    onNavigate: (Screen) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        shadowElevation = 8.dp,
        modifier = modifier
            .fillMaxWidth()
            .height(58.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            screens.forEach { screen ->
                val selected = currentRoute == screen.route
                val activeIcon = when (screen) {
                    Screen.Tasks -> Icons.Filled.TaskAlt
                    Screen.Schedule -> Icons.Filled.CalendarMonth
                    Screen.Admin -> Icons.Filled.Dashboard
                    Screen.Branch -> Icons.Filled.Storefront
                    Screen.Profile -> Icons.Filled.Person
                    else -> Icons.Filled.Person
                }
                val inactiveIcon = when (screen) {
                    Screen.Tasks -> Icons.Outlined.TaskAlt
                    Screen.Schedule -> Icons.Outlined.CalendarMonth
                    Screen.Admin -> Icons.Outlined.Dashboard
                    Screen.Branch -> Icons.Outlined.Storefront
                    Screen.Profile -> Icons.Outlined.Person
                    else -> Icons.Outlined.Person
                }

                val contentColor = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                val backgroundColor = if (selected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f) else Color.Transparent

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { onNavigate(screen) }
                        .padding(vertical = 4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(backgroundColor)
                            .padding(horizontal = 14.dp, vertical = 3.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (selected) activeIcon else inactiveIcon,
                            contentDescription = screen.title,
                            tint = contentColor,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = screen.title,
                        fontSize = 10.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                        color = contentColor,
                        maxLines = 1
                    )
                }
            }
        }
    }
}
