package tech.scryme.app

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
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
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.notifications.NotificationHelper
import tech.scryme.app.notifications.ScrymeFirebaseMessagingService
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

data class InAppNotificationEvent(
    val title: String,
    val body: String,
    val targetScreen: String?
)

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var sessionManager: SessionManager

    private val authViewModel: AuthViewModel by viewModels()

    private val _notificationEvents = MutableSharedFlow<InAppNotificationEvent>(extraBufferCapacity = 1)
    val notificationEvents = _notificationEvents.asSharedFlow()

    private val _pendingTargetScreen = MutableSharedFlow<String>(extraBufferCapacity = 1)
    val pendingTargetScreen = _pendingTargetScreen.asSharedFlow()

    private val foregroundNotificationReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ScrymeFirebaseMessagingService.ACTION_FOREGROUND_NOTIFICATION) {
                val title = intent.getStringExtra(ScrymeFirebaseMessagingService.EXTRA_TITLE) ?: "Notification"
                val body = intent.getStringExtra(ScrymeFirebaseMessagingService.EXTRA_BODY) ?: ""
                val targetScreen = intent.getStringExtra(ScrymeFirebaseMessagingService.EXTRA_TARGET_SCREEN)
                _notificationEvents.tryEmit(InAppNotificationEvent(title, body, targetScreen))
            }
        }
    }

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

        val filter = IntentFilter(ScrymeFirebaseMessagingService.ACTION_FOREGROUND_NOTIFICATION)
        ContextCompat.registerReceiver(
            this,
            foregroundNotificationReceiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED
        )

        setContent {
            val themeMode by sessionManager.themeModeFlow.collectAsState(initial = "SYSTEM")
            ScrymeTheme(themeMode = themeMode) {
                MainAppScreen(
                    authViewModel = authViewModel,
                    notificationEvents = notificationEvents,
                    pendingTargetScreen = pendingTargetScreen
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(foregroundNotificationReceiver)
        } catch (e: Exception) {
            // Ignored if not registered
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

        val targetScreen = intent?.getStringExtra(NotificationHelper.EXTRA_TARGET_SCREEN)
        if (!targetScreen.isNull_or_empty_or_blank()) {
            targetScreen?.let { _pendingTargetScreen.tryEmit(it) }
        }
    }

    private fun String?.isNull_or_empty_or_blank(): Boolean {
        return this == null || this.trim().isEmpty()
    }
}

@Composable
fun MainAppScreen(
    authViewModel: AuthViewModel = hiltViewModel(),
    notificationEvents: kotlinx.coroutines.flow.Flow<InAppNotificationEvent>? = null,
    pendingTargetScreen: kotlinx.coroutines.flow.Flow<String>? = null
) {
    val navController = rememberNavController()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(pendingTargetScreen, isLoggedIn) {
        if (isLoggedIn && pendingTargetScreen != null) {
            pendingTargetScreen.collect { target ->
                val route = when (target.lowercase()) {
                    "tasks", "task" -> Screen.Tasks.route
                    "schedule", "shifts", "shift", "attendance" -> Screen.Schedule.route
                    "admin", "announcement", "announcements" -> Screen.Admin.route
                    "sales", "orders", "order" -> Screen.Sales.route
                    "profile" -> Screen.Profile.route
                    else -> Screen.Tasks.route
                }
                navController.navigate(route) {
                    launchSingleTop = true
                }
            }
        }
    }

    LaunchedEffect(notificationEvents) {
        notificationEvents?.collect { event ->
            scope.launch {
                val actionLabel = if (!event.targetScreen.isNull_or_empty_or_blank()) "View" else null
                val result = snackbarHostState.showSnackbar(
                    message = "${event.title}: ${event.body}",
                    actionLabel = actionLabel,
                    duration = SnackbarDuration.Short
                )
                if (result == SnackbarResult.ActionPerformed && !event.targetScreen.isNull_or_empty_or_blank()) {
                    val route = when (event.targetScreen?.lowercase()) {
                        "tasks", "task" -> Screen.Tasks.route
                        "schedule", "shifts", "shift", "attendance" -> Screen.Schedule.route
                        "admin", "announcement", "announcements" -> Screen.Admin.route
                        "sales", "orders", "order" -> Screen.Sales.route
                        "profile" -> Screen.Profile.route
                        else -> Screen.Tasks.route
                    }
                    navController.navigate(route) {
                        launchSingleTop = true
                    }
                }
            }
        }
    }

    val bottomNavScreens = listOf(
        Screen.Tasks,
        Screen.Schedule,
        Screen.Admin,
        Screen.Profile
    )

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
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

private fun String?.isNull_or_empty_or_blank(): Boolean {
    return this == null || this.trim().isEmpty()
}
