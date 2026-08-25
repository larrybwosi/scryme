pub mod v3_customers_api {
    use crate::client::ScrymeClient;
    use serde_json::Value;

    pub async fn customers_get_customers(
        _client: &ScrymeClient,
        _org_slug: &str,
    ) -> Result<Value, String> {
        Ok(Value::Array(vec![]))
    }
}

pub mod v3_members_terminal_api {
    use crate::client::ScrymeClient;
    use serde_json::Value;

    pub async fn terminal_members_controller_login(
        _client: &ScrymeClient,
        _org_slug: &str,
        _dto: &crate::models::TerminalLoginDto,
    ) -> Result<Value, String> {
        Ok(Value::Null)
    }
}
