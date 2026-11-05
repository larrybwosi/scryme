package tech.scryme.app.analytics

import android.content.Context
import android.os.Build
import android.util.Log
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import tech.scryme.app.BuildConfig
import tech.scryme.app.analytics.models.OpenPanelEvents
import tech.scryme.app.analytics.models.OpenPanelIdentifyPayload
import tech.scryme.app.analytics.models.OpenPanelIdentifyRequest
import tech.scryme.app.analytics.models.OpenPanelTrackPayload
import tech.scryme.app.analytics.models.OpenPanelTrackRequest
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OpenPanelTracker @Inject constructor(
    @ApplicationContext private val context: Context,
    private val okHttpClient: OkHttpClient,
    private val gson: Gson = Gson(),
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    private val tag = "OpenPanelTracker"
    private val scope = CoroutineScope(SupervisorJob() + ioDispatcher)

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private val globalProperties = ConcurrentHashMap<String, Any?>()
    private var currentProfileId: String? = null
    private var lastScreenName: String? = null

    val isEnabled: Boolean
        get() {
            val clientId = BuildConfig.OPENPANEL_CLIENT_ID
            return clientId.isNotBlank() &&
                !clientId.contains("PLACEHOLDER", ignoreCase = true) &&
                clientId != "your-openpanel-client-id"
        }

    init {
        initDefaultProperties()
    }

    private fun initDefaultProperties() {
        globalProperties["__platform"] = "android"
        globalProperties["__app_version"] = BuildConfig.VERSION_NAME
        globalProperties["__build_number"] = BuildConfig.VERSION_CODE
        Build.VERSION.RELEASE?.let { globalProperties["__os_version"] = it }
        globalProperties["__sdk_int"] = Build.VERSION.SDK_INT
        Build.MANUFACTURER?.let { globalProperties["__device_manufacturer"] = it }
        Build.MODEL?.let { globalProperties["__device_model"] = it }
    }

    fun setGlobalProperty(key: String, value: Any?) {
        if (value == null) {
            globalProperties.remove(key)
        } else {
            globalProperties[key] = value
        }
    }

    fun setGlobalProperties(properties: Map<String, Any?>) {
        properties.forEach { (k, v) ->
            if (v == null) {
                globalProperties.remove(k)
            } else {
                globalProperties[k] = v
            }
        }
    }

    fun clearGlobalProperty(key: String) {
        globalProperties.remove(key)
    }

    fun track(event: String, properties: Map<String, Any?>? = null) {
        if (!isEnabled) {
            Log.d(tag, "OpenPanel tracking skipped (not enabled): $event")
            return
        }

        scope.launch {
            try {
                val mergedProperties = HashMap<String, Any?>(globalProperties)
                if (lastScreenName != null) {
                    mergedProperties["__screen_name"] = lastScreenName
                }
                properties?.forEach { (k, v) ->
                    mergedProperties[k] = v
                }

                val payload = OpenPanelTrackPayload(
                    name = event,
                    profileId = currentProfileId,
                    properties = mergedProperties
                )
                val requestBody = OpenPanelTrackRequest(payload = payload)
                dispatchPayload(requestBody)
            } catch (e: Exception) {
                Log.w(tag, "Failed to dispatch track event: $event", e)
            }
        }
    }

    fun identify(
        profileId: String,
        email: String? = null,
        name: String? = null,
        avatar: String? = null,
        properties: Map<String, Any?>? = null
    ) {
        currentProfileId = profileId

        if (!isEnabled) {
            Log.d(tag, "OpenPanel identify skipped (not enabled): $profileId")
            return
        }

        scope.launch {
            try {
                val firstName = name?.split(" ")?.firstOrNull()
                val lastName = name?.split(" ")?.drop(1)?.joinToString(" ")?.ifBlank { null }

                val mergedProperties = HashMap<String, Any?>(globalProperties)
                properties?.forEach { (k, v) ->
                    mergedProperties[k] = v
                }

                val identifyPayload = OpenPanelIdentifyPayload(
                    profileId = profileId,
                    firstName = firstName,
                    lastName = lastName,
                    email = email,
                    avatar = avatar,
                    properties = mergedProperties
                )
                val requestBody = OpenPanelIdentifyRequest(payload = identifyPayload)
                dispatchPayload(requestBody)
            } catch (e: Exception) {
                Log.w(tag, "Failed to dispatch identify request: $profileId", e)
            }
        }
    }

    fun screenView(screenName: String, properties: Map<String, Any?>? = null) {
        lastScreenName = screenName
        val screenProps = mutableMapOf<String, Any?>("screen_name" to screenName)
        properties?.let { screenProps.putAll(it) }
        track(OpenPanelEvents.SCREEN_VIEW, screenProps)
    }

    fun clearUser() {
        currentProfileId = null
        globalProperties.remove("org_slug")
        globalProperties.remove("org_name")
        globalProperties.remove("location_id")
        globalProperties.remove("user_id")
        globalProperties.remove("user_email")
    }

    private fun resolveTrackUrl(): String {
        var host = BuildConfig.OPENPANEL_HOST.trim()
        if (host.isBlank()) {
            host = "https://api.openpanel.dev"
        }
        if (!host.startsWith("http://") && !host.startsWith("https://")) {
            host = "https://$host"
        }
        val cleanedHost = host.trimEnd('/')
        return if (cleanedHost.endsWith("/track")) {
            cleanedHost
        } else if (cleanedHost.endsWith("/api")) {
            "$cleanedHost/track"
        } else {
            "$cleanedHost/track"
        }
    }

    private fun dispatchPayload(bodyObject: Any) {
        val endpointUrl = resolveTrackUrl()
        val jsonString = gson.toJson(bodyObject)
        val body = jsonString.toRequestBody(jsonMediaType)

        val requestBuilder = Request.Builder()
            .url(endpointUrl)
            .post(body)
            .header("openpanel-client-id", BuildConfig.OPENPANEL_CLIENT_ID)
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .header("User-Agent", "Scryme-Android/${BuildConfig.VERSION_NAME} (Linux; Android ${Build.VERSION.RELEASE}; ${Build.MODEL})")

        val clientSecret = BuildConfig.OPENPANEL_CLIENT_SECRET
        if (clientSecret.isNotBlank() &&
            !clientSecret.contains("PLACEHOLDER", ignoreCase = true) &&
            clientSecret != "your-openpanel-client-secret"
        ) {
            requestBuilder.header("openpanel-client-secret", clientSecret)
        }

        val request = requestBuilder.build()
        okHttpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful && response.code != 202) {
                Log.w(tag, "OpenPanel ingest response error code: ${response.code}")
            } else {
                Log.d(tag, "OpenPanel ingest dispatched successfully (code: ${response.code})")
            }
        }
    }
}
