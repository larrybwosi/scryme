# Secure Prisma Studio Deployment Guide

Prisma Studio is a powerful visual web editor for your PostgreSQL database schemas managed by `@repo/db`. By default, **Prisma Studio does not feature built-in authentication**. Exposing it directly to the public internet without access controls would allow anyone to view, modify, or delete data across your database.

This guide outlines strategies to deploy and access Prisma Studio securely in production and staging environments.

---

## 🔒 Security Overview

To prevent unauthorized access, access to Prisma Studio must be protected using one or more of the following security layers:

1. **Reverse Proxy Basic Authentication (Traefik / Nginx)**: Prompts for HTTP basic auth credentials before proxying traffic to Prisma Studio.
2. **Local Host Binding & SSH Tunneling**: Restricts the Prisma Studio port (`5555`) to `127.0.0.1` on the server host, allowing access exclusively via encrypted SSH tunnels.
3. **On-Demand Execution**: Running the `prisma-studio` container only when active database administration is required and stopping it immediately afterward.

---

## 1. Option A: Traefik Basic Authentication (Recommended Web Access)

When deploying with Docker Compose using the primary production stack (`docker-compose.prod.yml`), Prisma Studio is integrated with Traefik reverse proxy and protected by Traefik's `basicauth` middleware.

### Step 1: Generate Basic Auth Credentials
Generate htpasswd-formatted credentials using `htpasswd` or Python/OpenSSL:

```bash
# Example using htpasswd (install via apache2-utils or httpd-tools)
htpasswd -nb admin your_secure_password
```
Output:
`admin:$apr1$q89T1P18$x/T5pD63lH698305.8123.`

### Step 2: Configure Environment Variables
Add the domain and basic auth credentials to your production `.env` file.

> **Important**: Docker Compose interprets `$` as environment variable syntax. You must escape every `$` in your password hash by doubling it (`$$`).

```env
STUDIO_DOMAIN=studio.scryme.tech
STUDIO_PORT=5555
STUDIO_BASIC_AUTH=admin:$$apr1$$q89T1P18$$x/T5pD63lH698305.8123.
```

### Step 3: Start the Service
```bash
docker compose -f docker-compose.prod.yml up -d prisma-studio
```

Traefik will route incoming HTTPS requests from `https://studio.scryme.tech` to Prisma Studio after successfully verifying HTTP Basic Auth credentials.

---

## 2. Option B: Local Host Binding & SSH Tunneling (Private Admin Access)

If you prefer not to expose Prisma Studio to a public domain, you can keep the service bound exclusively to `127.0.0.1` on the server host and access it securely through an SSH tunnel.

### Step 1: Verify Host Binding in `docker-compose.yml`
In `docker-compose.yml`, the `prisma-studio` service binds port `5555` to `127.0.0.1`:

```yaml
ports:
  - "127.0.0.1:5555:5555"
```

### Step 2: Create an SSH Tunnel from Your Local Machine
Run the following command on your local workstation:

```bash
ssh -L 5555:127.0.0.1:5555 user@your-production-server.com
```

### Step 3: Access Prisma Studio
Open your local web browser and navigate to:
`http://localhost:5555`

All traffic will be securely encrypted and forwarded through your SSH connection to the server's local Prisma Studio container.

---

## 3. Option C: On-Demand Lifecycle Management

To minimize the attack surface, leave the `prisma-studio` container stopped when not actively inspecting database records.

### Start Studio On Demand:
```bash
docker compose up -d prisma-studio
```

### Perform Operations
Access Studio via HTTPS basic auth or SSH tunnel.

### Stop Studio Immediately After Use:
```bash
docker compose stop prisma-studio
```

---

## 🛠 Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `STUDIO_DOMAIN` | `studio.scryme.tech` | Public domain routed by Traefik to Prisma Studio |
| `STUDIO_PORT` | `5555` | Internal container port for Prisma Studio |
| `STUDIO_BASIC_AUTH` | `admin:$$apr1...` | htpasswd formatted user:hash string for HTTP basic auth |
| `DATABASE_URL` | - | PostgreSQL connection URL for `@repo/db` |

---

## 🔍 Health Checks & Troubleshooting

### Container Health Check
The container verifies readiness via HTTP GET to `http://localhost:5555`:
```bash
docker inspect --format='{{json .State.Health}}' $(docker compose ps -q prisma-studio)
```

### Checking Container Logs
```bash
docker compose logs -f prisma-studio
```

### Common Issues
1. **401 Unauthorized Error in Traefik**:
   - Verify that `STUDIO_BASIC_AUTH` is correctly set in `.env` and that all `$` symbols in the hash are escaped as `$$`.
2. **502 Bad Gateway / Connection Refused**:
   - Check if the `db` PostgreSQL service is healthy and reachable over `scryme-prod-network`.
   - Verify `DATABASE_URL` matches the internal database hostname (`db:5432`).
