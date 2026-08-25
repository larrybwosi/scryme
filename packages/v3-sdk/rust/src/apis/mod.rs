pub mod configuration {
    #[derive(Clone, Debug, Default)]
    pub struct Configuration {
        pub base_path: String,
        pub user_agent: Option<String>,
        pub bearer_access_token: Option<String>,
    }
}

pub mod v3_customers_api {
    use crate::client::ScrymeClient;
    use crate::Configuration;
    use serde_json::Value;

    pub async fn customers_get_customers(
        _configuration: &Configuration,
        _org_slug: &str,
        _offset: Option<f64>,
        _limit: Option<f64>,
    ) -> Result<Value, String> {
        Ok(Value::Array(vec![]))
    }
}

pub mod v3_members_terminal_api {
    use crate::client::ScrymeClient;
    use crate::Configuration;
    use serde_json::Value;

    pub async fn terminal_members_controller_login(
        _configuration: &Configuration,
        _terminal_login_dto: crate::models::TerminalLoginDto,
    ) -> Result<Value, String> {
        Ok(Value::Null)
    }
}
