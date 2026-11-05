package tech.scryme.app.analytics.models

import com.google.gson.annotations.SerializedName

/**
 * OpenPanel Ingest Request wrapper for /track endpoint.
 *
 * Wire format matches OpenPanel TrackHandlerPayload:
 * { "type": "track", "payload": { "name": "...", "properties": { ... }, "profileId": "..." } }
 * { "type": "identify", "payload": { "profileId": "...", "email": "...", "firstName": "...", "properties": { ... } } }
 */
data class OpenPanelTrackRequest(
    @SerializedName("type")
    val type: String = "track",
    @SerializedName("payload")
    val payload: OpenPanelTrackPayload
)

data class OpenPanelTrackPayload(
    @SerializedName("name")
    val name: String,
    @SerializedName("profileId")
    val profileId: String? = null,
    @SerializedName("properties")
    val properties: Map<String, Any?>? = null
)

data class OpenPanelIdentifyRequest(
    @SerializedName("type")
    val type: String = "identify",
    @SerializedName("payload")
    val payload: OpenPanelIdentifyPayload
)

data class OpenPanelIdentifyPayload(
    @SerializedName("profileId")
    val profileId: String,
    @SerializedName("firstName")
    val firstName: String? = null,
    @SerializedName("lastName")
    val lastName: String? = null,
    @SerializedName("email")
    val email: String? = null,
    @SerializedName("avatar")
    val avatar: String? = null,
    @SerializedName("properties")
    val properties: Map<String, Any?>? = null
)

/**
 * Standardized Android Analytics Events for Scryme Mobile App.
 */
object OpenPanelEvents {
    const val APP_OPENED = "app_opened"
    const val SCREEN_VIEW = "screen_view"

    // Auth & Identity
    const val LOGIN_ATTEMPT = "user_login_attempt"
    const val LOGIN_SUCCESS = "user_login_success"
    const val LOGIN_FAILED = "user_login_failed"
    const val LOGOUT = "user_logout"
    const val PASSKEY_AUTH_TRIGGERED = "passkey_auth_triggered"
    const val WEB_BROWSER_AUTH_TRIGGERED = "web_browser_auth_triggered"

    // Duty & Attendance
    const val DUTY_STATUS_CHANGED = "duty_status_changed"

    // Tasks & Operations
    const val TASK_STATUS_UPDATED = "task_status_updated"
    const val TASK_CREATED = "task_created"
    const val TASK_CHECKLIST_TOGGLED = "task_checklist_toggled"

    // Branches & Locations
    const val BRANCH_PINNED = "branch_coordinates_pinned"
    const val BRANCH_SELECTED = "branch_selected"

    // POS Pairing
    const val POS_PAIRING_ATTEMPT = "pos_device_pairing_attempt"
    const val POS_PAIRING_SUCCESS = "pos_device_pairing_success"
    const val POS_PAIRING_FAILED = "pos_device_pairing_failed"

    // Settings
    const val THEME_CHANGED = "theme_changed"
}
