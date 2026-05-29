use anyhow::Result;
use chrono::Utc;
use log::{error, info};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::{DbInstances, DbPool};

const MAIN_DB_NAME: &str = "sqlite:pos_main.db";

// ============================================================
// Data Structures
// ============================================================

/// Severity level of an audit event.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum AuditLevel {
    Info,
    Warning,
    Critical,
}

/// A single, immutable audit trail record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub id: String,
    pub timestamp: String,
    pub level: AuditLevel,
    pub action: String,
    pub actor_id: Option<String>,
    pub actor_name: Option<String>,
    pub location_id: Option<String>,
    pub device_id: Option<String>,
    pub details: serde_json::Value,
}

/// Filter options for querying audit logs.
#[derive(Debug, Deserialize)]
pub struct AuditFilter {
    pub action: Option<String>,
    pub actor_id: Option<String>,
    pub level: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

// ============================================================
// Internal helpers
// ============================================================

async fn get_db_pool(app: &AppHandle) -> Result<SqlitePool, String> {
    let instances = app.state::<DbInstances>();
    let guard = instances.0.read().await;

    let db_name = if cfg!(feature = "standalone") {
        "sqlite:pos_standalone.db"
    } else {
        MAIN_DB_NAME
    };

    if let Some(DbPool::Sqlite(pool)) = guard.get(db_name) {
        Ok(pool.clone())
    } else {
        Err(format!("Database {} not found.", db_name))
    }
}

// ============================================================
// Public API
// ============================================================

pub async fn init_state(app: &AppHandle) {
    let pool = match get_db_pool(app).await {
        Ok(p) => p,
        Err(e) => {
            error!("[AuditStore] Failed to get main DB pool: {}", e);
            return;
        }
    };

    let create_audit_table = r#"
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            level TEXT,
            action TEXT,
            actor_id TEXT,
            actor_name TEXT,
            location_id TEXT,
            device_id TEXT,
            details TEXT
        )
    "#;

    let _ = sqlx::query(create_audit_table).execute(&pool).await;

    // Migrate from legacy JSONL if it exists
    let _ = migrate_legacy_logs(app, &pool).await;
}

async fn migrate_legacy_logs(app: &AppHandle, pool: &SqlitePool) -> Result<()> {
    let app_data_dir = app.path().app_data_dir()?;
    let legacy_path = app_data_dir.join("logs").join("audit.jsonl");

    if !legacy_path.exists() {
        return Ok(());
    }

    info!("[AuditStore] Migrating legacy audit logs...");
    let content = tokio::fs::read_to_string(&legacy_path).await?;
    let mut tx = pool.begin().await?;

    for line in content.lines() {
        if let Ok(event) = serde_json::from_str::<AuditEvent>(line) {
            let level_str = match event.level {
                AuditLevel::Info => "INFO",
                AuditLevel::Warning => "WARNING",
                AuditLevel::Critical => "CRITICAL",
            };

            let _ = sqlx::query(
                "INSERT OR IGNORE INTO audit_logs (id, timestamp, level, action, actor_id, actor_name, location_id, device_id, details) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
            )
            .bind(&event.id)
            .bind(&event.timestamp)
            .bind(level_str)
            .bind(&event.action)
            .bind(&event.actor_id)
            .bind(&event.actor_name)
            .bind(&event.location_id)
            .bind(&event.device_id)
            .bind(serde_json::to_string(&event.details).unwrap_or_default())
            .execute(&mut *tx)
            .await;
        }
    }
    tx.commit().await?;
    let _ = tokio::fs::remove_file(&legacy_path).await;
    Ok(())
}

/// Append a single structured audit event to the database.
#[allow(clippy::too_many_arguments)]
pub fn write_event(
    app: &AppHandle,
    level: AuditLevel,
    action: impl Into<String>,
    actor_id: Option<String>,
    actor_name: Option<String>,
    location_id: Option<String>,
    device_id: Option<String>,
    details: serde_json::Value,
) -> Result<()> {
    let action_str = action.into();
    let event = AuditEvent {
        id: uuid::Uuid::now_v7().to_string(),
        timestamp: Utc::now().to_rfc3339(),
        level: level.clone(),
        action: action_str.clone(),
        actor_id: actor_id.clone(),
        actor_name: actor_name.clone(),
        location_id: location_id.clone(),
        device_id: device_id.clone(),
        details: details.clone(),
    };

    // Also emit to the structured system log
    info!(
        "[AUDIT] {} | {:?} | {}",
        event.timestamp, event.action, event.details
    );

    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Ok(pool) = get_db_pool(&app_handle).await {
            let level_str = match level {
                AuditLevel::Info => "INFO",
                AuditLevel::Warning => "WARNING",
                AuditLevel::Critical => "CRITICAL",
            };

            let _ = sqlx::query(
                "INSERT INTO audit_logs (id, timestamp, level, action, actor_id, actor_name, location_id, device_id, details) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
            )
            .bind(event.id)
            .bind(event.timestamp)
            .bind(level_str)
            .bind(action_str)
            .bind(actor_id)
            .bind(actor_name)
            .bind(location_id)
            .bind(device_id)
            .bind(serde_json::to_string(&details).unwrap_or_default())
            .execute(&pool)
            .await;
        }
    });

    Ok(())
}

/// Read audit events from the database with optional filtering.
pub async fn read_events(app: &AppHandle, filter: AuditFilter) -> Result<Vec<AuditEvent>> {
    let pool = get_db_pool(app).await.map_err(|e| anyhow::anyhow!(e))?;

    let mut query_str = "SELECT * FROM audit_logs WHERE 1=1".to_string();
    if filter.action.is_some() { query_str.push_str(" AND action LIKE ?"); }
    if filter.actor_id.is_some() { query_str.push_str(" AND actor_id = ?"); }
    if filter.level.is_some() { query_str.push_str(" AND level = ?"); }
    query_str.push_str(" ORDER BY timestamp DESC");

    let limit = filter.limit.unwrap_or(200);
    let offset = filter.offset.unwrap_or(0);
    query_str.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    let mut query = sqlx::query(&query_str);
    if let Some(action) = &filter.action { query = query.bind(format!("%{}%", action)); }
    if let Some(actor_id) = &filter.actor_id { query = query.bind(actor_id); }
    if let Some(level) = &filter.level { query = query.bind(level.to_uppercase()); }

    let rows = query.fetch_all(&pool).await?;
    let mut events = Vec::new();
    for row in rows {
        let level_str: String = row.get("level");
        let level = match level_str.as_str() {
            "WARNING" => AuditLevel::Warning,
            "CRITICAL" => AuditLevel::Critical,
            _ => AuditLevel::Info,
        };

        events.push(AuditEvent {
            id: row.get("id"),
            timestamp: row.get("timestamp"),
            level,
            action: row.get("action"),
            actor_id: row.get("actor_id"),
            actor_name: row.get("actor_name"),
            location_id: row.get("location_id"),
            device_id: row.get("device_id"),
            details: serde_json::from_str(&row.get::<String, _>("details")).unwrap_or(serde_json::Value::Null),
        });
    }

    Ok(events)
}

/// Get the path to the current system log directory.
fn get_system_log_path(app: &AppHandle) -> Result<PathBuf> {
    let app_data_dir = app.path().app_data_dir()?;
    Ok(app_data_dir.join("logs"))
}

/// Read the most recent N lines from the system application log.
pub fn read_system_log(app: &AppHandle, lines: usize) -> Result<String> {
    let log_dir = get_system_log_path(app)?;

    let mut log_files: Vec<PathBuf> = fs::read_dir(&log_dir)?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| {
            p.extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| ext == "log")
                .unwrap_or(false)
        })
        .collect::<Vec<PathBuf>>();

    log_files.sort_by(|a, b| {
        let ta = fs::metadata(a).and_then(|m| m.modified()).ok();
        let tb = fs::metadata(b).and_then(|m| m.modified()).ok();
        tb.cmp(&ta)
    });

    if log_files.is_empty() {
        return Ok("No log files found yet.".to_string());
    }

    let latest = &log_files[0];
    let content = fs::read_to_string(latest)?;

    let collected_lines: Vec<&str> = content.lines().collect();
    let tail: Vec<&str> = collected_lines
        .iter()
        .rev()
        .take(lines)
        .cloned()
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();

    Ok(tail.join("\n"))
}

// ============================================================
// Tauri Commands
// ============================================================

#[tauri::command]
pub async fn write_audit_log(
    app: AppHandle,
    action: String,
    level: Option<String>,
    actor_id: Option<String>,
    actor_name: Option<String>,
    location_id: Option<String>,
    device_id: Option<String>,
    details: Option<serde_json::Value>,
) -> Result<(), String> {
    let lvl = match level.as_deref().unwrap_or("INFO").to_uppercase().as_str() {
        "WARNING" | "WARN" => AuditLevel::Warning,
        "CRITICAL" | "ERROR" => AuditLevel::Critical,
        _ => AuditLevel::Info,
    };

    write_event(
        &app,
        lvl,
        action,
        actor_id,
        actor_name,
        location_id,
        device_id,
        details.unwrap_or(serde_json::Value::Null),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_audit_logs(
    app: AppHandle,
    action: Option<String>,
    actor_id: Option<String>,
    level: Option<String>,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<Vec<AuditEvent>, String> {
    let filter = AuditFilter {
        action,
        actor_id,
        level,
        limit,
        offset,
    };
    read_events(&app, filter).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_system_logs(app: AppHandle, lines: Option<usize>) -> Result<String, String> {
    read_system_log(&app, lines.unwrap_or(500)).map_err(|e| e.to_string())
}
