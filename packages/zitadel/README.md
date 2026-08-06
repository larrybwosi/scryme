# `@repo/zitadel`

Shared integration module mapping the [Zitadel](https://zitadel.com/) Identity and Access Management (IAM) provider into the Scryme workspace.

## 🚀 Key Features

- **Fine-Grained RBAC**: Coordinates organization roles, user permissions, and user group setups.
- **Zitadel API Proxies**: Simplifies user creation, profile metadata updates, and organization-scoped client registration workflows using Zitadel v2 APIs.
- **Secure Token Introspection**: Helpers to parse and validate incoming JWTs from Zitadel to secure internal microservices.

## 🔑 Getting Zitadel Credentials (Self-Hosted)

For the system to integrate properly with a self-hosted Zitadel instance, follow these steps to configure your environment:

### 1. `ZITADEL_MASTERKEY`
- Secret string used by Zitadel to encrypt database values and configuration elements.
- Must be **EXACTLY 32 characters** long (e.g., `masterkey1234567890masterkey12`).
- Keep it secure and identical across `zitadel-setup` and `zitadel` service deployments.

### 2. `ZITADEL_API_URL`
- Point this to the external user-facing URL of your Zitadel instance.
- Example: `http://auth.scryme.local` or `https://auth.scryme.tech`.

### 3. Create an Organization and Get `ZITADEL_ORG_ID`
- Access your Zitadel Console (default login: `zitadel-admin@zitadel.localhost`).
- Navigate to the **Organization** switcher at the top left of the dashboard.
- Create a new organization (e.g., `Scryme Platform`).
- Copy the **Organization ID** and set it as `ZITADEL_ORG_ID`.

### 4. Create a Project and Get `ZITADEL_PROJECT_ID`
- Navigate to **Projects** under your active organization.
- Click **Create New Project** and name it (e.g., `Scryme Portal`).
- Copy the **Project ID** from the project's detail page and set it as `ZITADEL_PROJECT_ID`.

### 5. Create an Application and Get `ZITADEL_CLIENT_ID`
- Inside your project, click **New Application**.
- Name the application (e.g., `Scryme Client`) and choose **Web** as the application type.
- Choose **Code** (OIDC Authorization Code Flow with PKCE) as the authentication method.
- Configure URIs:
  - Redirect URIs: `https://scryme.tech/api/auth/callback/zitadel`, `http://localhost:3000/api/auth/callback/zitadel`
  - Post Logout Redirect URIs: `https://scryme.tech`, `http://localhost:3000`
- Copy the generated **Client ID** and set it as `ZITADEL_CLIENT_ID`.

### 6. Generate a Service Account and `ZITADEL_ADMIN_TOKEN`
For the Scryme backend to dynamically provision resources and users:
- Go to **Users** in the Zitadel Console sidebar and select **Service Accounts**.
- Click **New**, enter a name (e.g., `scryme-api-provisioner`), and create.
- Grant the service account the **IAM Owner** role (for global administration) or **Org Owner** role (for single-organization management) under Organization Permissions.
- Open the service account details, navigate to **Personal Access Tokens**, generate a new token, and set it as `ZITADEL_ADMIN_TOKEN`.
