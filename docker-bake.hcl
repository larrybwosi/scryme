group "default" {
  targets = ["api", "crm", "web", "site"]
}

variable "REPO_LOWER" {
  default = "larrybwosi/scryme"
}

variable "VERSION" {
  default = "latest"
}

variable "NEXT_PUBLIC_API_URL" {
  default = ""
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
