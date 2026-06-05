use serde::{Serialize, Serializer};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum BackendError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),

    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Not found: {0}")]
    #[allow(dead_code)]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Authentication error: {0}")]
    Auth(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl Serialize for BackendError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // For solid frontend communication, we provide a structured error
        #[derive(Serialize)]
        struct ErrorWrapper {
            #[serde(rename = "type")]
            error_type: String,
            message: String,
        }

        let error_type = match self {
            BackendError::Database(_) => "Database",
            BackendError::Io(_) => "IO",
            BackendError::Serialization(_) => "Serialization",
            BackendError::Network(_) => "Network",
            BackendError::Tauri(_) => "Tauri",
            BackendError::Config(_) => "Config",
            BackendError::NotFound(_) => "NotFound",
            BackendError::Validation(_) => "Validation",
            BackendError::Auth(_) => "Auth",
            BackendError::Internal(_) => "Internal",
        };

        ErrorWrapper {
            error_type: error_type.to_string(),
            message: self.to_string(),
        }
        .serialize(serializer)
    }
}

pub type BackendResult<T> = Result<T, BackendError>;
