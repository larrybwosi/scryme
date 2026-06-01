use crate::error::{BackendError, BackendResult};
use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use tauri::AppHandle;
use tauri::Manager;

pub async fn init(app: &AppHandle) -> BackendResult<SqlitePool> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| BackendError::Config(format!("failed to get app data dir: {}", e)))?;

    std::fs::create_dir_all(&app_dir).map_err(BackendError::Io)?;

    let db_path = app_dir.join("bakery.db");

    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .pragma("foreign_keys", "ON");

    let pool = SqlitePool::connect_with(options).await?;

    // Ensure WAL and foreign keys are active (belt-and-suspenders for existing connections)
    sqlx::query("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")
        .execute(&pool)
        .await?;

    // Seed system units
    let units_count: (i32,) = sqlx::query_as("SELECT COUNT(*) FROM system_units")
        .fetch_one(&pool)
        .await?;

    if units_count.0 == 0 {
        let units = [
            ("mass-kg", "Kilogram", "kg", "MASS", "UNIVERSAL", 1),
            ("mass-g", "Gram", "g", "MASS", "UNIVERSAL", 0),
            ("vol-l", "Liter", "L", "VOLUME", "UNIVERSAL", 1),
            ("vol-ml", "Milliliter", "mL", "VOLUME", "UNIVERSAL", 0),
            ("count-pcs", "Piece", "pc", "COUNT", "UNIVERSAL", 1),
        ];

        for (id, name, symbol, unit_type, category, is_base) in units {
            sqlx::query(
                "INSERT INTO system_units (id, name, symbol, type, category, is_base_unit) VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(id)
            .bind(name)
            .bind(symbol)
            .bind(unit_type)
            .bind(category)
            .bind(is_base)
            .execute(&pool).await?;
        }
    }

    Ok(pool)
}