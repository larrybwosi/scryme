package tech.scryme.app.data.interceptor

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
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
        val LOCATION_ID = stringPreferencesKey("location_id")
        val MEMBER_ID = stringPreferencesKey("member_id")
    }

    val accessTokenFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[ACCESS_TOKEN] }
    val memberTokenFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[MEMBER_TOKEN] }
    val orgSlugFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[ORG_SLUG] }
    val locationIdFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[LOCATION_ID] }
    val memberIdFlow: Flow<String?> = context.dataStore.data.map { prefs -> prefs[MEMBER_ID] }

    suspend fun getAccessToken(): String? = accessTokenFlow.first()
    suspend fun getMemberToken(): String? = memberTokenFlow.first()
    suspend fun getOrgSlug(): String? = orgSlugFlow.first()
    suspend fun getLocationId(): String? = locationIdFlow.first()
    suspend fun getMemberId(): String? = memberIdFlow.first()

    suspend fun saveSession(
        accessToken: String,
        orgSlug: String,
        locationId: String? = null,
        memberId: String? = null,
        memberToken: String? = null
    ) {
        context.dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN] = accessToken
            prefs[ORG_SLUG] = orgSlug
            if (locationId != null) prefs[LOCATION_ID] = locationId
            if (memberId != null) prefs[MEMBER_ID] = memberId
            if (memberToken != null) prefs[MEMBER_TOKEN] = memberToken
        }
    }

    suspend fun updateLocationId(locationId: String) {
        context.dataStore.edit { prefs ->
            prefs[LOCATION_ID] = locationId
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { prefs ->
            prefs.clear()
        }
    }
}
