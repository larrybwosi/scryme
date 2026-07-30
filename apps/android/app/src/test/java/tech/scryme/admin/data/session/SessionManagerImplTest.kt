package tech.scryme.admin.data.session

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Test

class SessionManagerImplTest {

    @Test
    fun `saveSession updates token activeOrgSlug and activeOrgId correctly`() {
        val sessionManager = SessionManagerImpl(context = null)

        assertNull(sessionManager.token.value)
        assertNull(sessionManager.activeOrgSlug.value)
        assertNull(sessionManager.activeOrgId.value)
        assertNull(sessionManager.userEmail.value)
        assertNull(sessionManager.userName.value)

        sessionManager.saveSession(
            token = "token_123",
            orgSlug = "org_slug",
            orgId = "org_id",
            userEmail = "admin@scryme.tech",
            userName = "System Admin"
        )

        assertEquals("token_123", sessionManager.token.value)
        assertEquals("org_slug", sessionManager.activeOrgSlug.value)
        assertEquals("org_id", sessionManager.activeOrgId.value)
        assertEquals("admin@scryme.tech", sessionManager.userEmail.value)
        assertEquals("System Admin", sessionManager.userName.value)
    }

    @Test
    fun `clearSession clears token activeOrgSlug activeOrgId and user details`() {
        val sessionManager = SessionManagerImpl(context = null)
        sessionManager.saveSession(
            token = "token_123",
            orgSlug = "org_slug",
            orgId = "org_id",
            userEmail = "admin@scryme.tech",
            userName = "System Admin"
        )

        sessionManager.clearSession()

        assertNull(sessionManager.token.value)
        assertNull(sessionManager.activeOrgSlug.value)
        assertNull(sessionManager.activeOrgId.value)
        assertNull(sessionManager.userEmail.value)
        assertNull(sessionManager.userName.value)
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

    @Test
    fun `customization preferences have expected defaults and update correctly`() {
        val sessionManager = SessionManagerImpl(context = null)

        // Verify Defaults
        assertEquals("Deep Navy", sessionManager.themePreference.value)
        assertEquals(10, sessionManager.syncIntervalSeconds.value)
        assertTrue(sessionManager.notificationsEnabled.value)
        assertTrue(sessionManager.autoLoginEnabled.value)

        // Save new values
        sessionManager.saveThemePreference("Forest Dark")
        sessionManager.saveSyncInterval(30)
        sessionManager.saveNotificationsEnabled(false)
        sessionManager.saveAutoLoginEnabled(false)

        // Verify values updated successfully
        assertEquals("Forest Dark", sessionManager.themePreference.value)
        assertEquals(30, sessionManager.syncIntervalSeconds.value)
        assertFalse(sessionManager.notificationsEnabled.value)
        assertFalse(sessionManager.autoLoginEnabled.value)
    }
}
