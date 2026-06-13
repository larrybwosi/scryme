group "default" {
  targets = ["api", "bakery", "crm", "web"]
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
    "ghcr.io/${var.REPO_LOWER}/api:latest",
    "ghcr.io/${var.REPO_LOWER}/api:${var.VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = "${var.NEXT_PUBLIC_API_URL}"
    BETTER_AUTH_SECRET = "${var.BETTER_AUTH_SECRET}"
  }
}

target "bakery" {
  context = "."
  dockerfile = "apps/bakery/Dockerfile"
  tags = [
    "ghcr.io/${var.REPO_LOWER}/bakery:latest",
    "ghcr.io/${var.REPO_LOWER}/bakery:${var.VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = "${var.NEXT_PUBLIC_API_URL}"
    BETTER_AUTH_SECRET = "${var.BETTER_AUTH_SECRET}"
  }
}

target "crm" {
  context = "."
  dockerfile = "apps/crm/Dockerfile"
  tags = [
    "ghcr.io/${var.REPO_LOWER}/crm:latest",
    "ghcr.io/${var.REPO_LOWER}/crm:${var.VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = "${var.NEXT_PUBLIC_API_URL}"
    BETTER_AUTH_SECRET = "${var.BETTER_AUTH_SECRET}"
  }
}

target "web" {
  context = "."
  dockerfile = "apps/web/Dockerfile"
  tags = [
    "ghcr.io/${var.REPO_LOWER}/web:latest",
    "ghcr.io/${var.REPO_LOWER}/web:${var.VERSION}"
  ]
  args = {
    NEXT_PUBLIC_API_URL = "${var.NEXT_PUBLIC_API_URL}"
    BETTER_AUTH_SECRET = "${var.BETTER_AUTH_SECRET}"
  }
}
