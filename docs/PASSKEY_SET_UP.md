# Passkey Setup & Digital Asset Links Configuration Guide

This document outlines how to configure Android Passkeys and WebAuthn for Scryme across `api.scryme.tech` and the Android Application (`tech.scryme.app`).

## 1. Digital Asset Links (`assetlinks.json`)

To enable Android CredentialManager to verify passkeys for `api.scryme.tech` and `scryme.tech`, an `assetlinks.json` file must be hosted on your HTTPS domain at:

```
https://api.scryme.tech/.well-known/assetlinks.json
https://scryme.tech/.well-known/assetlinks.json
```

### File Contents Example (`assetlinks.json`):

```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "tech.scryme.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_RELEASE_KEYSTORE_FINGERPRINT_HERE"
      ]
    }
  }
]
```

### Obtaining your App's SHA-256 Fingerprint:

For debug keystores:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

For release keystores:
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

Look for the line starting with `SHA256:` and copy the uppercase hex colon-separated string into `sha256_cert_fingerprints`.

---

## 2. Better-Auth Configuration on Server

Ensure your Better-Auth server instance in `packages/auth/src/auth.ts` has the `passkey()` plugin registered:

```typescript
import { passkey } from "@better-auth/passkey";

export const auth = betterAuth({
  plugins: [
    passkey({
      rpID: "scryme.tech",
      rpName: "Scryme Platform"
    })
  ]
});
```

---

## 3. Passkey Registration & Authentication Features on Android

The Scryme Android application (`tech.scryme.app`) supports full Passkey operations via Jetpack CredentialManager:

1. **Sign-In with Passkey**:
   - On the Android Login screen, users can tap **"Sign in with Passkey"**.
   - The app requests authentication options from `/api/auth/passkey/generate-authenticate-options` and presents the system biometric / screen lock prompt.
   - Upon verification, the WebAuthn signature is verified at `/api/auth/passkey/verify-authentication` and a session token is issued.

2. **Registering a Passkey**:
   - In the **Profile Screen** under **Passkeys & Web Auth**, tap **"Add Passkey"**.
   - Provide a label for the device (e.g. "Work Android Phone").
   - The app initiates creation via `/api/auth/passkey/generate-register-options`, saves the public key on Android's secure credential store via CredentialManager, and verifies registration with `/api/auth/passkey/verify-registration`.

3. **Authorizing Web Apps via QR Code**:
   - On the **Profile Screen**, tap **"Scan QR to Authorize Web App"**.
   - Point the camera at the web terminal or web app QR code to authorize session pairing.
