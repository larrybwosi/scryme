group "default" {
  targets = ["api", "crm", "cms", "web", "site", "admin", "auth", "docs", "prisma-studio"]
}

variable "REPO_LOWER" {
  default = "larrybwosi/scryme"
}

variable "VERSION" {
  default = "latest"
}

variable "NEXT_PUBLIC_API_URL" {
  default = "APP_NEXT_PUBLIC_API_URL_PLACEHOLDER"
}

variable "BETTER_AUTH_SECRET" {
  default = ""
}

variable "NEXT_PUBLIC_OPENPANEL_CLIENT_ID" {
  default = "APP_NEXT_PUBLIC_OPENPANEL_CLIENT_ID_PLACEHOLDER"
}

variable "NEXT_PUBLIC_OPENPANEL_HOST" {
  default = "APP_NEXT_PUBLIC_OPENPANEL_HOST_PLACEHOLDER"
}

variable "OPENPANEL_CLIENT_ID" {
  default = "APP_OPENPANEL_CLIENT_ID_PLACEHOLDER"
}

variable "OPENPANEL_CLIENT_SECRET" {
  default = "APP_OPENPANEL_CLIENT_SECRET_PLACEHOLDER"
}

variable "OPENPANEL_HOST" {
  default = "APP_OPENPANEL_HOST_PLACEHOLDER"
}

variable "VITE_SANITY_PROJECT_ID" {
  default = ""
}

variable "VITE_SANITY_DATASET" {
  default = "production"
}

variable "VITE_API_URL" {
  default = "https://api.scryme.tech"
}

variable "VITE_WEB_URL" {
  default = "https://app.scryme.tech"
}

variable "VITE_POSTHOG_PROJECT_TOKEN" {
  default = ""
}

variable "VITE_POSTHOG_HOST" {
  default = "https://eu.i.posthog.com"
}

target "api" {
  context = "."
  dockerfile = "apps/api/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/api:latest",
    "ghcr.io/${REPO_LOWER}/api:${VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = NEXT_PUBLIC_API_URL
    BETTER_AUTH_SECRET = BETTER_AUTH_SECRET
    OPENPANEL_CLIENT_ID = OPENPANEL_CLIENT_ID
    OPENPANEL_CLIENT_SECRET = OPENPANEL_CLIENT_SECRET
    OPENPANEL_HOST = OPENPANEL_HOST
  }
}

target "admin" {
  context = "."
  dockerfile = "apps/admin/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/admin:latest",
    "ghcr.io/${REPO_LOWER}/admin:${VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = NEXT_PUBLIC_API_URL
    BETTER_AUTH_SECRET = BETTER_AUTH_SECRET
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID = NEXT_PUBLIC_OPENPANEL_CLIENT_ID
    NEXT_PUBLIC_OPENPANEL_HOST = NEXT_PUBLIC_OPENPANEL_HOST
  }
}

target "prisma-studio" {
  context = "."
  dockerfile = "docker/studio/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/prisma-studio:latest",
    "ghcr.io/${REPO_LOWER}/prisma-studio:${VERSION}"
  ]
}

target "docs" {
  context = "."
  dockerfile = "apps/docs/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/docs:latest",
    "ghcr.io/${REPO_LOWER}/docs:${VERSION}"
  ]
}

target "crm" {
  context = "."
  dockerfile = "apps/crm/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/crm:latest",
    "ghcr.io/${REPO_LOWER}/crm:${VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = NEXT_PUBLIC_API_URL
    BETTER_AUTH_SECRET = BETTER_AUTH_SECRET
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID = NEXT_PUBLIC_OPENPANEL_CLIENT_ID
    NEXT_PUBLIC_OPENPANEL_HOST = NEXT_PUBLIC_OPENPANEL_HOST
  }
}

target "cms" {
  context = "."
  dockerfile = "apps/cms/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/cms:latest",
    "ghcr.io/${REPO_LOWER}/cms:${VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = NEXT_PUBLIC_API_URL
    BETTER_AUTH_SECRET = BETTER_AUTH_SECRET
  }
}

target "web" {
  context = "."
  dockerfile = "apps/web/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/web:latest",
    "ghcr.io/${REPO_LOWER}/web:${VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = NEXT_PUBLIC_API_URL
    BETTER_AUTH_SECRET = BETTER_AUTH_SECRET
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID = NEXT_PUBLIC_OPENPANEL_CLIENT_ID
    NEXT_PUBLIC_OPENPANEL_HOST = NEXT_PUBLIC_OPENPANEL_HOST
  }
}

target "site" {
  context = "."
  dockerfile = "apps/site-next/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/site:latest",
    "ghcr.io/${REPO_LOWER}/site:${VERSION}"
  ]
  args = {
    VITE_SANITY_PROJECT_ID = VITE_SANITY_PROJECT_ID
    VITE_SANITY_DATASET = VITE_SANITY_DATASET
    VITE_API_URL = VITE_API_URL
    VITE_WEB_URL = VITE_WEB_URL
    VITE_POSTHOG_PROJECT_TOKEN = VITE_POSTHOG_PROJECT_TOKEN
    VITE_POSTHOG_HOST = VITE_POSTHOG_HOST
  }
}

target "auth" {
  context = "."
  dockerfile = "apps/auth/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/auth:latest",
    "ghcr.io/${REPO_LOWER}/auth:${VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = NEXT_PUBLIC_API_URL
    BETTER_AUTH_SECRET = BETTER_AUTH_SECRET
  }
}
