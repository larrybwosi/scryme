# `@repo/windmill`

The Windmill automation and workflow helper library for the Scryme platform. It handles workspace auto-provisioning, template deployment, and running background automations, flows, and scripts on a [Windmill](https://www.windmill.dev/) instance.

## 🚀 Key Features

- **Automated Workspace Provisioning**: Dynamically provisions safe, organization-scoped workspaces during client onboarding.
- **Dynamic Flow & Script Deployments**: Keeps Windmill scripts, schedules, variables, and flows updated from source folders.
- **Reliable Job Execution**: Executes custom scripts and flows asynchronously, tracking executions inside the database.

## 🔑 Getting Windmill Credentials (Self-Hosted Latest)

For Scryme to provision workspaces and trigger flows, it requires a connection to a self-hosted Windmill instance. Follow these steps to configure your credentials:

### 1. `WINDMILL_INTERNAL_URL` & `WINDMILL_BASE_URL`
- `WINDMILL_INTERNAL_URL`: Point this to the Windmill server. If using the default Docker Compose configuration, it is `http://windmill-server:8000`.
- `WINDMILL_BASE_URL`: This is the public URL of the Windmill instance (e.g., `https://windmill.scryme.tech` or `http://localhost:8000` for local access).

### 2. Generate a Super-Admin API Token (`WINDMILL_ADMIN_API_KEY`)
To provision organization workspaces, Scryme must authenticate as a super-admin of the self-hosted Windmill instance.
1. Access the Windmill dashboard (e.g., at `http://localhost:8000` or your configured domain).
2. Login as the super-admin (the default admin account created during setup, or your custom admin).
3. Click on the user profile icon / dropdown menu in the bottom-left or top-right corner.
4. Go to **Instance Settings** (or **Users** -> **Tokens** in newer versions) and navigate to **API Tokens**.
5. Click **Create Token** (or **New Token**):
   - Provide a descriptive name (e.g., `scryme-platform-provisioner`).
   - Assign **Global Admin** or **Super Admin** permissions to allow creating workspaces.
6. Generate the token, copy the secret string immediately, and assign it to the `WINDMILL_ADMIN_API_KEY` environment variable.
