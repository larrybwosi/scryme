package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.DeviceProvisionResponseDto
import tech.scryme.admin.domain.repository.DeviceRepository

class DeviceAuthViewModel(
    private val deviceRepository: DeviceRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<DeviceProvisionResponseDto>>(UiState.Idle)
    val uiState: StateFlow<UiState<DeviceProvisionResponseDto>> = _uiState.asStateFlow()

    fun onQrCodeScanned(qrContent: String) {
        if (_uiState.value is UiState.Loading) return

        val extractedToken = parseSetupToken(qrContent)
        if (extractedToken.isBlank()) {
            _uiState.value = UiState.Error("Invalid QR Code payload. Could not extract setup token.")
            return
        }

        authorizeDevice(extractedToken)
    }

    fun authorizeDevice(setupToken: String) {
        val trimmedToken = setupToken.trim()
        if (trimmedToken.isBlank()) {
            _uiState.value = UiState.Error("Setup token cannot be empty.")
            return
        }

        viewModelScope.launch {
            _uiState.value = UiState.Loading
            deviceRepository.provisionDevice(trimmedToken)
                .onSuccess { response ->
                    if (response.apiKey.isNullOrBlank() && response.deviceRegistryId.isNullOrBlank()) {
                        _uiState.value = UiState.Error("Provisioning failed: Invalid or empty response from server.")
                    } else {
                        _uiState.value = UiState.Success(response)
                    }
                }
                .onFailure { error ->
                    _uiState.value = UiState.Error(error.message ?: "Failed to authorize POS device")
                }
        }
    }

    fun resetState() {
        _uiState.value = UiState.Idle
    }

    fun parseSetupToken(content: String): String {
        val trimmed = content.trim()
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                val jsonObject = JsonParser.parseString(trimmed).asJsonObject
                if (jsonObject.has("token") && !jsonObject.get("token").isJsonNull) {
                    val token = jsonObject.get("token").asString.trim()
                    if (token.isNotEmpty()) return token
                }
                if (jsonObject.has("setupToken") && !jsonObject.get("setupToken").isJsonNull) {
                    val setupToken = jsonObject.get("setupToken").asString.trim()
                    if (setupToken.isNotEmpty()) return setupToken
                }
                if (jsonObject.has("rawToken") && !jsonObject.get("rawToken").isJsonNull) {
                    val rawToken = jsonObject.get("rawToken").asString.trim()
                    if (rawToken.isNotEmpty()) return rawToken
                }
            } catch (e: Exception) {
                // Fallback to raw string if JSON parsing fails
            }
        }
        return trimmed
    }
}
