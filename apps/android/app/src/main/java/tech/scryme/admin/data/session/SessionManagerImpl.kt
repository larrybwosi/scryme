package tech.scryme.admin.data.session

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import tech.scryme.admin.domain.session.SessionManager

class SessionManagerImpl : SessionManager {
    private val _token = MutableStateFlow<String?>(null)
    override val token: StateFlow<String?> = _token.asStateFlow()

    private val _activeOrgSlug = MutableStateFlow<String?>(null)
    override val activeOrgSlug: StateFlow<String?> = _activeOrgSlug.asStateFlow()

    private val _activeOrgId = MutableStateFlow<String?>(null)
    override val activeOrgId: StateFlow<String?> = _activeOrgId.asStateFlow()

    override fun saveSession(token: String, orgSlug: String?, orgId: String?) {
        _token.value = token
        _activeOrgSlug.value = orgSlug
        _activeOrgId.value = orgId
    }

    override fun clearSession() {
        _token.value = null
        _activeOrgSlug.value = null
        _activeOrgId.value = null
    }

    override fun updateActiveOrg(orgSlug: String, orgId: String) {
        _activeOrgSlug.value = orgSlug
        _activeOrgId.value = orgId
    }
}
