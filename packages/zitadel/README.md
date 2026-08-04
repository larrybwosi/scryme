# `@repo/zitadel`

Shared integration module mapping the [Zitadel](https://zitadel.com/) Identity and Access Management (IAM) provider into the Scryme workspace.

## 🚀 Key Features

- **Fine-Grained RBAC**: Coordinates organization roles, user permissions, and user group setups.
- **Zitadel API Proxies**: Simplifies user creation, profile metadata updates, and organization-scoped client registration workflows.
- **Secure Token Introspection**: Helpers to parse and validate incoming JWTs from Zitadel to secure internal microservices.

## 🔑 Getting Zitadel Credentials (Self-Hosted Latest)

For the system to integrate properly with a self-hosted Zitadel instance (running on Docker Compose or production servers), follow these steps to configure your environment:

### 1. `ZITADEL_MASTERKEY`
- This is a secret string used by Zitadel to encrypt database values and configuration elements.
- It must be **exactly or at least 32 characters** long (e.g., `masterkey1234567890masterkey12`).
- Make sure to keep it secure and identical across `zitadel-setup` and `zitadel` service deployments.

### 2. `ZITADEL_API_URL`
- Point this to the external user-facing URL of your Zitadel instance.
- If self-hosting locally with Traefik/Dokploy on `auth.scryme.local`, use `http://auth.scryme.local` or `https://auth.scryme.tech`.

### 3. Create an Organization and Get `ZITADEL_ORG_ID`
- Access your Zitadel Console (usually at your `ZITADEL_API_URL` or login using the default admin credentials `zitadel-admin@zitadel.localhost`).
- Navigate to the **Organization** switcher at the top left of the dashboard.
- Create a new organization (e.g., `Scryme Platform`).
- Copy the **Organization ID** (found directly under the organization name or in the URL) and set it as `ZITADEL_ORG_ID`.

### 4. Create a Project and Get `ZITADEL_PROJECT_ID`
- Navigate to **Projects** under your active organization.
- Click **Create New Project** and name it (e.g., `Scryme Portal`).
- Once created, copy the **Project ID** from the top of the project's detail page and set it as `ZITADEL_PROJECT_ID`.

### 5. Create an Application and Get `ZITADEL_CLIENT_ID`
- Inside the project you just created, click **New Application**.
- Enter an application name (e.g., `Scryme Client`).
- Choose **Web** as the application type.
- Choose **Code** (OIDC Authorization Code Flow with PKCE) as the authentication method.
- Configure redirect URIs:
  - Redirect URIs: `https://scryme.tech/api/auth/callback/zitadel`, `http://localhost:3000/api/auth/callback/zitadel`
  - Post Logout Redirect URIs: `https://scryme.tech`, `http://localhost:3000`
- Once created, copy the generated **Client ID** and set it as `ZITADEL_CLIENT_ID`.

### 6. Generate an Admin Service Account and `ZITADEL_ADMIN_TOKEN`
For the Scryme backend to dynamically provision users, clients, and manage roles, it requires administrative API access.
- Go to **Users** in the Zitadel Console sidebar.
- Click the **Service Users** tab, and click **New**.
- Create a service user (e.g., `scryme-api-provisioner`) and assign the **Global Administrator** role (or organization manager role if restricted to a single organization).
- Once the service user is created:
  - Click on the service user to open their details.
  - Navigate to **Personal Access Tokens**.
  - Click **New**, set an optional expiration date, and generate the token.
  - Copy the generated token immediately and set it as `ZITADEL_ADMIN_TOKEN`.
