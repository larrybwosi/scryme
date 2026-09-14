use scryme_sdk::{ScrymeClient, ScrymeClientBuilder};

#[test]
fn test_scryme_client_builder() {
    let client = ScrymeClientBuilder::new()
        .base_url("https://api.scryme.tech")
        .org_slug("demo-org")
        .bearer_token("secret-token")
        .build();

    assert_eq!(client.config.base_path, "https://api.scryme.tech");
    assert_eq!(client.org_slug, "demo-org");
    assert_eq!(
        client.config.bearer_access_token,
        Some("secret-token".to_string())
    );
}

#[test]
fn test_scryme_client_convenience_methods() {
    let mut client = ScrymeClient::new("http://localhost:3000", "default-org");

    assert_eq!(client.config.base_path, "http://localhost:3000");
    assert_eq!(client.org_slug, "default-org");

    client.set_bearer_token("new-token");
    assert_eq!(
        client.config.bearer_access_token,
        Some("new-token".to_string())
    );

    let client2 = client.with_org_slug("updated-org");
    assert_eq!(client2.org_slug, "updated-org");
}
