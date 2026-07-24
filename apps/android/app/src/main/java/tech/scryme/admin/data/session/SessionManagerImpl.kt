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

    private val sharedPrefs: SharedPreferences? by lazy {
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
                try {
                    // Fallback to standard private SharedPreferences if Keystore/Encrypted SharedPreferences fails
                    ctx.getSharedPreferences("scryme_session_fallback", Context.MODE_PRIVATE)
                } catch (ex: Exception) {
                    null
                }
            }
        }
    }

    private val _token = MutableStateFlow<String?>(sharedPrefs?.getString("TOKEN", null))
    override val token: StateFlow<String?> = _token.asStateFlow()

    private val _activeOrgSlug = MutableStateFlow<String?>(sharedPrefs?.getString("ACTIVE_ORG_SLUG", null))
    override val activeOrgSlug: StateFlow<String?> = _activeOrgSlug.asStateFlow()

    private val _activeOrgId = MutableStateFlow<String?>(sharedPrefs?.getString("ACTIVE_ORG_ID", null))
    override val activeOrgId: StateFlow<String?> = _activeOrgId.asStateFlow()

    override fun saveSession(token: String, orgSlug: String?, orgId: String?) {
        _token.value = token
        _activeOrgSlug.value = orgSlug
        _activeOrgId.value = orgId

        sharedPrefs?.edit()?.apply {
            putString("TOKEN", token)
            putString("ACTIVE_ORG_SLUG", orgSlug)
            putString("ACTIVE_ORG_ID", orgId)
            apply()
        }
    }

    override fun clearSession() {
        _token.value = null
        _activeOrgSlug.value = null
        _activeOrgId.value = null

        sharedPrefs?.edit()?.apply {
            remove("TOKEN")
            remove("ACTIVE_ORG_SLUG")
            remove("ACTIVE_ORG_ID")
            apply()
        }
    }

    override fun updateActiveOrg(orgSlug: String, orgId: String) {
        _activeOrgSlug.value = orgSlug
        _activeOrgId.value = orgId

        sharedPrefs?.edit()?.apply {
            putString("ACTIVE_ORG_SLUG", orgSlug)
            putString("ACTIVE_ORG_ID", orgId)
            apply()
        }
    }
}
