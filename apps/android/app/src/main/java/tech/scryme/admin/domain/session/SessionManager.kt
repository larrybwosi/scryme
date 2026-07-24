package tech.scryme.admin.domain.session

import kotlinx.coroutines.flow.StateFlow

interface SessionManager {
    val token: StateFlow<String?>
    val activeOrgSlug: StateFlow<String?>
    val activeOrgId: StateFlow<String?>

    fun saveSession(token: String, orgSlug: String?, orgId: String?)
    fun clearSession()
    fun updateActiveOrg(orgSlug: String, orgId: String)
}
