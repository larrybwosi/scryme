use crate::configuration::Configuration;

/// Builder for constructing a [`ScrymeClient`].
#[derive(Debug, Clone, Default)]
pub struct ScrymeClientBuilder {
    base_url: Option<String>,
    org_slug: Option<String>,
    bearer_token: Option<String>,
    user_agent: Option<String>,
    client: Option<reqwest::Client>,
}

impl ScrymeClientBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn base_url(mut self, base_url: impl Into<String>) -> Self {
        self.base_url = Some(base_url.into());
        self
    }

    pub fn org_slug(mut self, org_slug: impl Into<String>) -> Self {
        self.org_slug = Some(org_slug.into());
        self
    }

    pub fn bearer_token(mut self, token: impl Into<String>) -> Self {
        self.bearer_token = Some(token.into());
        self
    }

    pub fn user_agent(mut self, user_agent: impl Into<String>) -> Self {
        self.user_agent = Some(user_agent.into());
        self
    }

    pub fn client(mut self, client: reqwest::Client) -> Self {
        self.client = Some(client);
        self
    }

    pub fn build(self) -> ScrymeClient {
        let base_path = self
            .base_url
            .unwrap_or_else(|| "http://localhost:3000".to_string());
        let org_slug = self.org_slug.unwrap_or_default();

        let mut config = Configuration::new();
        config.base_path = base_path;
        config.bearer_access_token = self.bearer_token;

        if let Some(ua) = self.user_agent {
            config.user_agent = Some(ua);
        }
        if let Some(c) = self.client {
            config.client = c;
        }

        ScrymeClient {
            config,
            org_slug,
        }
    }
}

/// The main high-level client wrapper for the Scryme V3 API.
#[derive(Debug, Clone)]
pub struct ScrymeClient {
    pub config: Configuration,
    pub org_slug: String,
}

impl ScrymeClient {
    /// Creates a new `ScrymeClient` with base URL and organization slug.
    pub fn new(base_url: impl Into<String>, org_slug: impl Into<String>) -> Self {
        ScrymeClientBuilder::new()
            .base_url(base_url)
            .org_slug(org_slug)
            .build()
    }

    /// Creates a builder to configure and instantiate `ScrymeClient`.
    pub fn builder() -> ScrymeClientBuilder {
        ScrymeClientBuilder::new()
    }

    /// Sets the bearer token for authentication.
    pub fn set_bearer_token(&mut self, token: impl Into<String>) {
        self.config.bearer_access_token = Some(token.into());
    }

    /// Consumes self and returns a new `ScrymeClient` with the given bearer token.
    pub fn with_bearer_token(mut self, token: impl Into<String>) -> Self {
        self.set_bearer_token(token);
        self
    }

    /// Sets the organization slug.
    pub fn set_org_slug(&mut self, org_slug: impl Into<String>) {
        self.org_slug = org_slug.into();
    }

    /// Consumes self and returns a new `ScrymeClient` with the updated organization slug.
    pub fn with_org_slug(mut self, org_slug: impl Into<String>) -> Self {
        self.set_org_slug(org_slug);
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_builder() {
        let client = ScrymeClient::builder()
            .base_url("https://api.scryme.tech")
            .org_slug("my-org")
            .bearer_token("test-token")
            .build();

        assert_eq!(client.config.base_path, "https://api.scryme.tech");
        assert_eq!(client.org_slug, "my-org");
        assert_eq!(client.config.bearer_access_token, Some("test-token".to_string()));
    }
}
