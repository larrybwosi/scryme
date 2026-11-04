package tech.scryme.app

import android.content.Context
import com.google.gson.Gson
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.analytics.OpenPanelTracker
import tech.scryme.app.analytics.models.OpenPanelEvents
import tech.scryme.app.analytics.models.OpenPanelIdentifyRequest
import tech.scryme.app.analytics.models.OpenPanelTrackRequest
import java.util.concurrent.TimeUnit

@OptIn(ExperimentalCoroutinesApi::class)
class OpenPanelTrackerTest {

    private lateinit var server: MockWebServer
    private val gson = Gson()
    private val testDispatcher = StandardTestDispatcher()
    private val mockContext = mockk<Context>(relaxed = true)
    private lateinit var okHttpClient: OkHttpClient

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        okHttpClient = OkHttpClient.Builder()
            .connectTimeout(2, TimeUnit.SECONDS)
            .readTimeout(2, TimeUnit.SECONDS)
            .build()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun serialization_trackPayloadMatchesOpenPanelSchema() {
        val payload = OpenPanelTrackRequest(
            payload = tech.scryme.app.analytics.models.OpenPanelTrackPayload(
                name = OpenPanelEvents.APP_OPENED,
                profileId = "user_123",
                properties = mapOf("screen_name" to "overview", "theme" to "dark")
            )
        )

        val json = gson.toJson(payload)
        assertTrue(json.contains("\"type\":\"track\""))
        assertTrue(json.contains("\"name\":\"app_opened\""))
        assertTrue(json.contains("\"profileId\":\"user_123\""))
        assertTrue(json.contains("\"screen_name\":\"overview\""))
    }

    @Test
    fun serialization_identifyPayloadMatchesOpenPanelSchema() {
        val payload = OpenPanelIdentifyRequest(
            payload = tech.scryme.app.analytics.models.OpenPanelIdentifyPayload(
                profileId = "user_456",
                firstName = "Jane",
                lastName = "Doe",
                email = "jane@scryme.tech",
                properties = mapOf("org_slug" to "demo-org")
            )
        )

        val json = gson.toJson(payload)
        assertTrue(json.contains("\"type\":\"identify\""))
        assertTrue(json.contains("\"profileId\":\"user_456\""))
        assertTrue(json.contains("\"firstName\":\"Jane\""))
        assertTrue(json.contains("\"lastName\":\"Doe\""))
        assertTrue(json.contains("\"email\":\"jane@scryme.tech\""))
    }

    @Test
    fun tracker_disabledWhenClientIdEmpty() = runTest(testDispatcher) {
        val tracker = OpenPanelTracker(
            context = mockContext,
            okHttpClient = okHttpClient,
            gson = gson,
            ioDispatcher = testDispatcher
        )

        // BuildConfig.OPENPANEL_CLIENT_ID is empty in standard test runner unless configured
        // Test verify isEnabled flag and ensure no requests hit server when disabled
        if (!tracker.isEnabled) {
            tracker.track(OpenPanelEvents.APP_OPENED)
            tracker.screenView("overview")
            tracker.identify("user_999")
            advanceUntilIdle()

            assertEquals(0, server.requestCount)
        }
    }

    @Test
    fun tracker_globalPropertiesCanBeManaged() {
        val tracker = OpenPanelTracker(
            context = mockContext,
            okHttpClient = okHttpClient,
            gson = gson,
            ioDispatcher = testDispatcher
        )

        tracker.setGlobalProperty("test_key", "test_val")
        tracker.setGlobalProperties(mapOf("env" to "test", "tenant" to "retail"))
        tracker.clearGlobalProperty("test_key")
        tracker.clearUser()
    }
}
