package tech.scryme.app.data.interceptor

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "session_prefs")

@Singleton
class SessionManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val MEMBER_TOKEN = stringPreferencesKey("member_token")
        val ORG_SLUG = stringPreferencesKey("org_slug")
        val ORG_NAME = stringPreferencesKey("org_name")
        val ORG_LOGO = stringPreferencesKey("org_logo")
        val ORG_CURRENCY = stringPreferencesKey("org_currency")
        val ORG_CURRENCY_SYMBOL = stringPreferencesKey("org_currency_symbol")
        val LOCATION_ID = stringPreferencesKey("location_id")
        val MEMBER_ID = stringPreferencesKey("member_id")
        val USER_NAME = stringPreferencesKey("user_name")
        val USER_EMAIL = stringPreferencesKey("user_email")
        val THEME_MODE = stringPreferencesKey("theme_mode") // "SYSTEM", "LIGHT", "DARK"
        val DUTY_STATUS = stringPreferencesKey("duty_status") // "ONLINE", "BUSY", "OFFLINE"
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
        val SHIFT_NOTIFICATIONS = booleanPreferencesKey("shift_notifications")
        val TASK_NOTIFICATIONS = booleanPreferencesKey("task_notifications")
    }

    val accessTokenFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[ACCESS_TOKEN] }
    val memberTokenFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[MEMBER_TOKEN] }
    val orgSlugFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[ORG_SLUG] }
    val orgNameFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[ORG_NAME] }
    val orgLogoFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[ORG_LOGO] }
    val orgCurrencyFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[ORG_CURRENCY] ?: "USD" }
    val orgCurrencySymbolFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[ORG_CURRENCY_SYMBOL] ?: "$" }
    val locationIdFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[LOCATION_ID] }
    val memberIdFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[MEMBER_ID] }
    val userNameFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[USER_NAME] }
    val userEmailFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[USER_EMAIL] }
    val themeModeFlow: Flow<String> = context.dataStore.data.map { prefs -> prefs[THEME_MODE] ?: "SYSTEM" }
    val dutyStatusFlow: Flow<String> = context.dataStore.data.map { prefs -> prefs[DUTY_STATUS] ?: "ONLINE" }
    val notificationsEnabledFlow: Flow<Boolean> = context.dataStore.data.map { prefs -> prefs[NOTIFICATIONS_ENABLED] ?: true }
    val shiftNotificationsFlow: Flow<Boolean> = context.dataStore.data.map { prefs -> prefs[SHIFT_NOTIFICATIONS] ?: true }
    val taskNotificationsFlow: Flow<Boolean> = context.dataStore.data.map { prefs -> prefs[TASK_NOTIFICATIONS] ?: true }

    suspend fun getAccessToken(): String? = accessTokenFlow.first()
    suspend fun getMemberToken(): String? = memberTokenFlow.first()
    suspend fun getOrgSlug(): String? = orgSlugFlow.first()
    suspend fun getOrgName(): String? = orgNameFlow.first()
    suspend fun getOrgLogo(): String? = orgLogoFlow.first()
    suspend fun getOrgCurrency(): String = orgCurrencyFlow.first() ?: "USD"
    suspend fun getOrgCurrencySymbol(): String = orgCurrencySymbolFlow.first() ?: "$"
    suspend fun getLocationId(): String? = locationIdFlow.first()
    suspend fun getMemberId(): String? = memberIdFlow.first()

    suspend fun saveSession(
        accessToken: String,
        orgSlug: String,
        locationId: String? = null,
        memberId: String? = null,
        memberToken: String? = null,
        userName: String? = null,
        userEmail: String? = null,
        orgName: String? = null,
        orgLogo: String? = null,
        orgCurrency: String? = null,
        orgCurrencySymbol: String? = null
    ) {
        context.dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN] = accessToken
            prefs[ORG_SLUG] = orgSlug
            if (locationId != null) prefs[LOCATION_ID] = locationId
            if (memberId != null) prefs[MEMBER_ID] = memberId
            if (memberToken != null) prefs[MEMBER_TOKEN] = memberToken
            if (userName != null) prefs[USER_NAME] = userName
            if (userEmail != null) prefs[USER_EMAIL] = userEmail
            if (orgName != null) prefs[ORG_NAME] = orgName
            if (orgLogo != null) prefs[ORG_LOGO] = orgLogo
            if (orgCurrency != null) prefs[ORG_CURRENCY] = orgCurrency
            if (orgCurrencySymbol != null) prefs[ORG_CURRENCY_SYMBOL] = orgCurrencySymbol
        }
    }

    suspend fun updateLocationId(locationId: String) {
        context.dataStore.edit { prefs ->
            prefs[LOCATION_ID] = locationId
        }
    }

    suspend fun updateThemeMode(themeMode: String) {
        context.dataStore.edit { prefs ->
            prefs[THEME_MODE] = themeMode
        }
    }

    suspend fun updateDutyStatus(status: String) {
        context.dataStore.edit { prefs ->
            prefs[DUTY_STATUS] = status
        }
    }

    suspend fun updateNotificationsEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[NOTIFICATIONS_ENABLED] = enabled
        }
    }

    suspend fun updateShiftNotifications(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[SHIFT_NOTIFICATIONS] = enabled
        }
    }

    suspend fun updateTaskNotifications(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[TASK_NOTIFICATIONS] = enabled
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { prefs ->
            val currentTheme = prefs[THEME_MODE]
            prefs.clear()
            // Retain theme choice on logout
            if (currentTheme != null) {
                prefs[THEME_MODE] = currentTheme
            }
        }
    }
}
