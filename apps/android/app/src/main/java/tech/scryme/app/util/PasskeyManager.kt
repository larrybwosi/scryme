package tech.scryme.app.util

import android.content.Context
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PublicKeyCredential
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.GetCredentialException

/**
 * Utility wrapper for Android CredentialManager handling Passkey operations.
 */
object PasskeyManager {

    /**
     * Trigger passkey creation ceremony using Better-Auth registration options JSON.
     * Returns WebAuthn registration response JSON.
     */
    suspend fun createPasskey(context: Context, requestJson: String): Result<String> {
        return try {
            val credentialManager = CredentialManager.create(context)
            val createPublicKeyCredentialRequest = CreatePublicKeyCredentialRequest(requestJson)

            val response = credentialManager.createCredential(
                context = context,
                request = createPublicKeyCredentialRequest
            )

            if (response is CreatePublicKeyCredentialResponse) {
                Result.success(response.registrationResponseJson)
            } else {
                Result.failure(IllegalStateException("Unexpected credential creation response type"))
            }
        } catch (e: CreateCredentialException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Trigger passkey authentication ceremony using Better-Auth authentication options JSON.
     * Returns WebAuthn authentication response JSON.
     */
    suspend fun getPasskey(context: Context, requestJson: String): Result<String> {
        return try {
            val credentialManager = CredentialManager.create(context)
            val getPublicKeyCredentialOption = GetPublicKeyCredentialOption(requestJson)
            val getCredentialRequest = GetCredentialRequest(
                credentialOptions = listOf(getPublicKeyCredentialOption)
            )

            val response = credentialManager.getCredential(
                context = context,
                request = getCredentialRequest
            )

            val credential = response.credential
            if (credential is PublicKeyCredential) {
                Result.success(credential.authenticationResponseJson)
            } else {
                Result.failure(IllegalStateException("Unexpected credential type returned"))
            }
        } catch (e: GetCredentialException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
