use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct TerminalLoginDto {
    pub card_id: Option<String>,
    pub pin: Option<String>,
}
