package tech.scryme.admin.data.session

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import tech.scryme.admin.domain.session.SessionManager

class SessionManagerImpl(private val context: Context? = null) : SessionManager {

    private var useFallback: Boolean = false

    private val encryptedPrefs: SharedPreferences? by lazy {
        context?.let { ctx ->
            try {
                val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
                EncryptedSharedPreferences.create(
                    "secure_scryme_session",
                    masterKeyAlias,
                    ctx,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                )
            } catch (e: Exception) {
                null
            }
        }
    }

    private val fallbackPrefs: SharedPreferences? by lazy {
        context?.let { ctx ->
            try {
                ctx.getSharedPreferences("scryme_session_fallback", Context.MODE_PRIVATE)
            } catch (e: Exception) {
                null
            }
        }
    }

    private fun getStringSafely(key: String, defaultValue: String?): String? {
        if (!useFallback) {
            try {
                val eps = encryptedPrefs
                if (eps != null) {
                    return eps.getString(key, defaultValue)
                }
            } catch (e: Exception) {
                useFallback = true
            }
        }
        try {
            return fallbackPrefs?.getString(key, defaultValue)
        } catch (e: Exception) {
            return defaultValue
        }
    }

    private fun getIntSafely(key: String, defaultValue: Int): Int {
        if (!useFallback) {
            try {
                val eps = encryptedPrefs
                if (eps != null) {
                    return eps.getInt(key, defaultValue)
                }
            } catch (e: Exception) {
                useFallback = true
            }
        }
        try {
            return fallbackPrefs?.getInt(key, defaultValue) ?: defaultValue
        } catch (e: Exception) {
            return defaultValue
        }
    }

    private fun getBooleanSafely(key: String, defaultValue: Boolean): Boolean {
        if (!useFallback) {
            try {
                val eps = encryptedPrefs
                if (eps != null) {
                    return eps.getBoolean(key, defaultValue)
                }
            } catch (e: Exception) {
                useFallback = true
            }
        }
        try {
            return fallbackPrefs?.getBoolean(key, defaultValue) ?: defaultValue
        } catch (e: Exception) {
            return defaultValue
        }
    }

    private fun writeSafely(block: SharedPreferences.Editor.() -> Unit) {
        if (!useFallback) {
            try {
                val eps = encryptedPrefs
                if (eps != null) {
                    val editor = eps.edit()
                    editor.block()
                    editor.apply()
                    return
                }
            } catch (e: Exception) {
                useFallback = true
            }
        }
        try {
            val fps = fallbackPrefs
            if (fps != null) {
                val editor = fps.edit()
                editor.block()
                editor.apply()
            }
        } catch (e: Exception) {
            // Suppress errors to prevent app crashes
        }
    }

    private val _token = MutableStateFlow<String?>(getStringSafely("TOKEN", null))
    override val token: StateFlow<String?> = _token.asStateFlow()

    private val _activeOrgSlug = MutableStateFlow<String?>(getStringSafely("ACTIVE_ORG_SLUG", null))
    override val activeOrgSlug: StateFlow<String?> = _activeOrgSlug.asStateFlow()

    private val _activeOrgId = MutableStateFlow<String?>(getStringSafely("ACTIVE_ORG_ID", null))
    override val activeOrgId: StateFlow<String?> = _activeOrgId.asStateFlow()

    private val _baseUrl = MutableStateFlow<String?>(getStringSafely("BASE_URL", "https://api.scryme.tech"))
    override val baseUrl: StateFlow<String?> = _baseUrl.asStateFlow()

    private val _userEmail = MutableStateFlow<String?>(getStringSafely("USER_EMAIL", null))
    override val userEmail: StateFlow<String?> = _userEmail.asStateFlow()

    private val _userName = MutableStateFlow<String?>(getStringSafely("USER_NAME", null))
    override val userName: StateFlow<String?> = _userName.asStateFlow()

    // Preferences & Customization state flows
    private val _themePreference = MutableStateFlow<String>(getStringSafely("THEME_PREF", "Deep Navy") ?: "Deep Navy")
    override val themePreference: StateFlow<String> = _themePreference.asStateFlow()

    private val _syncIntervalSeconds = MutableStateFlow<Int>(getIntSafely("SYNC_INTERVAL", 10))
    override val syncIntervalSeconds: StateFlow<Int> = _syncIntervalSeconds.asStateFlow()

    private val _notificationsEnabled = MutableStateFlow<Boolean>(getBooleanSafely("NOTIFICATIONS_ENABLED", true))
    override val notificationsEnabled: StateFlow<Boolean> = _notificationsEnabled.asStateFlow()

    private val _autoLoginEnabled = MutableStateFlow<Boolean>(getBooleanSafely("AUTO_LOGIN_ENABLED", true))
    override val autoLoginEnabled: StateFlow<Boolean> = _autoLoginEnabled.asStateFlow()

    override fun saveBaseUrl(url: String?) {
        _baseUrl.value = url
        writeSafely {
            if (url != null) {
                putString("BASE_URL", url)
            } else {
                remove("BASE_URL")
            }
        }
    }

    override fun saveSession(
        token: String,
        orgSlug: String?,
        orgId: String?,
        userEmail: String?,
        userName: String?
    ) {
        _token.value = token
        _activeOrgSlug.value = orgSlug
        _activeOrgId.value = orgId
        _userEmail.value = userEmail
        _userName.value = userName

        writeSafely {
            putString("TOKEN", token)
            if (orgSlug != null) {
                putString("ACTIVE_ORG_SLUG", orgSlug)
            } else {
                remove("ACTIVE_ORG_SLUG")
            }
            if (orgId != null) {
                putString("ACTIVE_ORG_ID", orgId)
            } else {
                remove("ACTIVE_ORG_ID")
            }
            if (userEmail != null) {
                putString("USER_EMAIL", userEmail)
            } else {
                remove("USER_EMAIL")
            }
            if (userName != null) {
                putString("USER_NAME", userName)
            } else {
                remove("USER_NAME")
            }
        }
    }

    override fun clearSession() {
        _token.value = null
        _activeOrgSlug.value = null
        _activeOrgId.value = null
        _userEmail.value = null
        _userName.value = null

        writeSafely {
            remove("TOKEN")
            remove("ACTIVE_ORG_SLUG")
            remove("ACTIVE_ORG_ID")
            remove("USER_EMAIL")
            remove("USER_NAME")
        }
    }

    override fun updateActiveOrg(orgSlug: String, orgId: String) {
        _activeOrgSlug.value = orgSlug
        _activeOrgId.value = orgId

        writeSafely {
            putString("ACTIVE_ORG_SLUG", orgSlug)
            putString("ACTIVE_ORG_ID", orgId)
        }
    }

    // Setters for Settings
    override fun saveThemePreference(theme: String) {
        _themePreference.value = theme
        writeSafely {
            putString("THEME_PREF", theme)
        }
    }

    override fun saveSyncInterval(seconds: Int) {
        _syncIntervalSeconds.value = seconds
        writeSafely {
            putInt("SYNC_INTERVAL", seconds)
        }
    }

    override fun saveNotificationsEnabled(enabled: Boolean) {
        _notificationsEnabled.value = enabled
        writeSafely {
            putBoolean("NOTIFICATIONS_ENABLED", enabled)
        }
    }

    override fun saveAutoLoginEnabled(enabled: Boolean) {
        _autoLoginEnabled.value = enabled
        writeSafely {
            putBoolean("AUTO_LOGIN_ENABLED", enabled)
        }
    }
}
