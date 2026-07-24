package tech.scryme.admin.data.session

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SessionManagerImplTest {

    @Test
    fun `saveSession updates token activeOrgSlug and activeOrgId correctly`() {
        val sessionManager = SessionManagerImpl(context = null)

        assertNull(sessionManager.token.value)
        assertNull(sessionManager.activeOrgSlug.value)
        assertNull(sessionManager.activeOrgId.value)

        sessionManager.saveSession("token_123", "org_slug", "org_id")

        assertEquals("token_123", sessionManager.token.value)
        assertEquals("org_slug", sessionManager.activeOrgSlug.value)
        assertEquals("org_id", sessionManager.activeOrgId.value)
    }

    @Test
    fun `clearSession clears token activeOrgSlug and activeOrgId`() {
        val sessionManager = SessionManagerImpl(context = null)
        sessionManager.saveSession("token_123", "org_slug", "org_id")

        sessionManager.clearSession()

        assertNull(sessionManager.token.value)
        assertNull(sessionManager.activeOrgSlug.value)
        assertNull(sessionManager.activeOrgId.value)
    }

    @Test
    fun `updateActiveOrg updates activeOrgSlug and activeOrgId`() {
        val sessionManager = SessionManagerImpl(context = null)
        sessionManager.saveSession("token_123", "old_slug", "old_id")

        sessionManager.updateActiveOrg("new_slug", "new_id")

        assertEquals("token_123", sessionManager.token.value)
        assertEquals("new_slug", sessionManager.activeOrgSlug.value)
        assertEquals("new_id", sessionManager.activeOrgId.value)
    }
}
