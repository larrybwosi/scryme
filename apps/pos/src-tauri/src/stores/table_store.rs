use anyhow::Result;
use log::info; // Removed 'error' to fix the unused import warning
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::{DbInstances, DbPool};
use sqlx::Row;
use uuid::Uuid;
use chrono::{DateTime, Utc};

const KDS_DB_NAME: &str = "sqlite:kds_orders.db";

// ============================================================
// Data Structures
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Table {
    pub id: String,
    pub number: String,
    pub capacity: i32,
    pub status: String, // available, occupied, reserved
    pub current_order_id: Option<String>,
    pub guests_count: Option<i32>,
    pub occupied_at: Option<String>, // ISO8601
    pub section: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableHistory {
    pub id: String,
    pub table_id: String,
    pub table_number: String,
    pub order_id: Option<String>,
    pub guests_count: i32,
    pub started_at: String,
    pub ended_at: String,
    pub duration_minutes: i32,
}

// ============================================================
// Internal helpers
// ============================================================

async fn get_db_pool(app: &AppHandle) -> Result<sqlx::SqlitePool, String> {
    let instances = app.state::<DbInstances>();
    let guard = instances.0.read().await;
    
    if let Some(DbPool::Sqlite(pool)) = guard.get(KDS_DB_NAME) {
        Ok(pool.clone())
    } else {
        Err(format!("Database {} not found. Ensure it is preloaded in tauri.conf.json.", KDS_DB_NAME))
    }
}

// ============================================================
// Public API
// ============================================================

pub async fn init_db(app: &AppHandle) -> Result<()> {
    let pool = get_db_pool(app).await.map_err(|e| anyhow::anyhow!(e))?;

    // Create tables table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS tables (
            id TEXT PRIMARY KEY,
            number TEXT UNIQUE NOT NULL,
            capacity INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'available',
            current_order_id TEXT,
            guests_count INTEGER,
            occupied_at TEXT,
            section TEXT,
            notes TEXT
        )
        "#
    )
    .execute(&pool)
    .await?;

    // Create table_history table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS table_history (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL,
            table_number TEXT NOT NULL,
            order_id TEXT,
            guests_count INTEGER NOT NULL,
            started_at TEXT NOT NULL,
            ended_at TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL
        )
        "#
    )
    .execute(&pool)
    .await?;

    info!("[TableStore] Database initialized.");
    Ok(())
}

#[tauri::command]
pub async fn get_tables_command(app: AppHandle) -> Result<Vec<Table>, String> {
    let pool = get_db_pool(&app).await?;

    let rows = sqlx::query("SELECT * FROM tables ORDER BY number ASC")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut tables = Vec::new();
    for row in rows {
        tables.push(Table {
            id: row.get("id"),
            number: row.get("number"),
            capacity: row.get("capacity"),
            status: row.get("status"),
            current_order_id: row.get("current_order_id"),
            guests_count: row.get("guests_count"),
            occupied_at: row.get("occupied_at"),
            section: row.get("section"),
            notes: row.get("notes"),
        });
    }

    Ok(tables)
}

#[tauri::command]
pub async fn upsert_table_command(app: AppHandle, table: Table) -> Result<(), String> {
    let pool = get_db_pool(&app).await?;

    sqlx::query(
        r#"
        INSERT INTO tables (id, number, capacity, status, current_order_id, guests_count, occupied_at, section, notes)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        ON CONFLICT(id) DO UPDATE SET
            number = excluded.number,
            capacity = excluded.capacity,
            status = excluded.status,
            current_order_id = excluded.current_order_id,
            guests_count = excluded.guests_count,
            occupied_at = excluded.occupied_at,
            section = excluded.section,
            notes = excluded.notes
        "#
    )
    .bind(&table.id)
    .bind(&table.number)
    .bind(table.capacity)
    .bind(&table.status)
    .bind(&table.current_order_id)
    .bind(table.guests_count)
    .bind(&table.occupied_at)
    .bind(&table.section)
    .bind(&table.notes)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_table_command(app: AppHandle, id: String) -> Result<(), String> {
    let pool = get_db_pool(&app).await?;

    sqlx::query("DELETE FROM tables WHERE id = ?1")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_table_status_command(
    app: AppHandle, 
    id: String, 
    status: String, 
    order_id: Option<String>, 
    guests_count: Option<i32>
) -> Result<(), String> {
    let pool = get_db_pool(&app).await?;

    // Get current table state to check for history recording
    let current: Table = sqlx::query("SELECT * FROM tables WHERE id = ?1")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map(|row| Table {
            id: row.get("id"),
            number: row.get("number"),
            capacity: row.get("capacity"),
            status: row.get("status"),
            current_order_id: row.get("current_order_id"),
            guests_count: row.get("guests_count"),
            occupied_at: row.get("occupied_at"),
            section: row.get("section"),
            notes: row.get("notes"),
        })
        .map_err(|e| e.to_string())?;

    let now = Utc::now().to_rfc3339();

    // 1. Logic for recording history when status changes from occupied to available
    if current.status == "occupied" && status == "available" {
        // Fix E0382: Borrow the value using &current.occupied_at instead of moving it
        if let Some(occupied_at_str) = &current.occupied_at {
            if let Ok(occupied_at) = DateTime::parse_from_rfc3339(occupied_at_str) {
                let duration = Utc::now().signed_duration_since(occupied_at.with_timezone(&Utc));
                let duration_minutes = duration.num_minutes() as i32;

                sqlx::query(
                    r#"
                    INSERT INTO table_history (id, table_id, table_number, order_id, guests_count, started_at, ended_at, duration_minutes)
                    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                    "#
                )
                .bind(Uuid::new_v4().to_string())
                .bind(&current.id)
                .bind(&current.number)
                .bind(&current.current_order_id)
                .bind(current.guests_count.unwrap_or(0))
                .bind(occupied_at_str)
                .bind(&now)
                .bind(duration_minutes)
                .execute(&pool)
                .await
                .map_err(|e| e.to_string())?;
            }
        }
    }

    // 2. Set occupied_at if changing to occupied
    let occupied_at = if status == "occupied" {
        Some(now)
    } else if status == "available" {
        None
    } else {
        current.occupied_at
    };

    // 3. Update the table status
    sqlx::query(
        "UPDATE tables SET status = ?1, current_order_id = ?2, guests_count = ?3, occupied_at = ?4 WHERE id = ?5"
    )
    .bind(&status)
    .bind(&order_id)
    .bind(guests_count)
    .bind(&occupied_at)
    .bind(&id)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_table_history_command(app: AppHandle, table_id: String) -> Result<Vec<TableHistory>, String> {
    let pool = get_db_pool(&app).await?;

    let rows = sqlx::query("SELECT * FROM table_history WHERE table_id = ?1 ORDER BY ended_at DESC LIMIT 50")
        .bind(table_id)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut history = Vec::new();
    for row in rows {
        history.push(TableHistory {
            id: row.get("id"),
            table_id: row.get("table_id"),
            table_number: row.get("table_number"),
            order_id: row.get("order_id"),
            guests_count: row.get("guests_count"),
            started_at: row.get("started_at"),
            ended_at: row.get("ended_at"),
            duration_minutes: row.get("duration_minutes"),
        });
    }

    Ok(history)
}