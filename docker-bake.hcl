group "default" {
  targets = ["api", "crm", "web", "site", "docs", "admin"]
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
  }
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
  }
}

target "site" {
  context = "."
  dockerfile = "apps/site/Dockerfile"
  tags = [
    "ghcr.io/${REPO_LOWER}/site:latest",
    "ghcr.io/${REPO_LOWER}/site:${VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = NEXT_PUBLIC_API_URL
    BETTER_AUTH_SECRET = BETTER_AUTH_SECRET
  }
}
