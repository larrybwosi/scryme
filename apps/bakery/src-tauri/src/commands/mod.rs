pub mod auth;
pub mod baker;
pub mod batch;
pub mod category;
pub mod inventory;
pub mod recipe;
pub mod settings;
pub mod system;
pub mod template;
pub mod unit;

pub use auth::*;
pub use baker::*;
pub use batch::*;
pub use category::*;
pub use inventory::*;
pub use recipe::*;
pub use settings::*;
pub use system::*;
pub use template::*;
pub use unit::*;

use crate::error::{BackendError, BackendResult};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn log_activity(
    pool: &SqlitePool,
    user_id: String,
    action: &str,
    entity_type: &str,
    entity_id: &str,
    details: Option<String>,
) -> BackendResult<()> {
    sqlx::query(
        "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(Uuid::new_v4().to_string())
    .bind(user_id)
    .bind(action)
    .bind(entity_type)
    .bind(entity_id)
    .bind(details)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    Ok(())
}

pub fn serde_json_to_string<T: serde::Serialize>(val: &T) -> BackendResult<String> {
    serde_json::to_string(val).map_err(BackendError::from)
}
