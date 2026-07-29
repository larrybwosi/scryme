package tech.scryme.admin.domain.session

import kotlinx.coroutines.flow.StateFlow

interface SessionManager {
    val token: StateFlow<String?>
    val activeOrgSlug: StateFlow<String?>
    val activeOrgId: StateFlow<String?>
    val baseUrl: StateFlow<String?>
    val userEmail: StateFlow<String?>
    val userName: StateFlow<String?>

    // User Customization Settings
    val themePreference: StateFlow<String>
    val syncIntervalSeconds: StateFlow<Int>
    val notificationsEnabled: StateFlow<Boolean>
    val autoLoginEnabled: StateFlow<Boolean>

    fun saveSession(
        token: String,
        orgSlug: String?,
        orgId: String?,
        userEmail: String? = null,
        userName: String? = null
    )
    fun clearSession()
    fun updateActiveOrg(orgSlug: String, orgId: String)
    fun saveBaseUrl(url: String?)

    // Setters for settings
    fun saveThemePreference(theme: String)
    fun saveSyncInterval(seconds: Int)
    fun saveNotificationsEnabled(enabled: Boolean)
    fun saveAutoLoginEnabled(enabled: Boolean)
}
