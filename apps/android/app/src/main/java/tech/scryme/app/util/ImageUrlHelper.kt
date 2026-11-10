package tech.scryme.app.util

import tech.scryme.app.BuildConfig

object ImageUrlHelper {
    /**
     * Resolves an image URL or avatar string into a fully-qualified URL or loadable image model.
     * Handles data URIs, absolute URLs, and relative backend endpoints like `/s/{code}` or `/images/{id}`.
     */
    fun resolve(url: String?): String? {
        if (url.isNullOrBlank()) return null
        val trimmed = url.trim()

        // Data URIs, Blob URIs, or Absolute HTTP/HTTPS URLs
        if (trimmed.startsWith("data:") ||
            trimmed.startsWith("blob:") ||
            trimmed.startsWith("http://") ||
            trimmed.startsWith("https://")
        ) {
            return trimmed
        }

        // Relative path resolution against backend origin
        val baseUrl = BuildConfig.BASE_URL.trimEnd('/')
        // If baseUrl is https://api.scryme.tech/api/v3, root origin is https://api.scryme.tech
        val rootOrigin = try {
            val uri = java.net.URI(baseUrl)
            val portPart = if (uri.port != -1 && uri.port != 80 && uri.port != 443) ":${uri.port}" else ""
            "${uri.scheme}://${uri.host}$portPart"
        } catch (_: Exception) {
            "https://api.scryme.tech"
        }

        val cleanPath = if (trimmed.startsWith("/")) trimmed else "/$trimmed"

        return if (cleanPath.startsWith("/s/") || cleanPath.startsWith("/images/")) {
            "$rootOrigin$cleanPath"
        } else {
            // General relative API path
            "$rootOrigin$cleanPath"
        }
    }
}
