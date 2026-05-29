use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::sync::RwLock;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_sql::{DbInstances, DbPool};

const MAIN_DB_NAME: &str = "sqlite:pos_main.db";
const MAX_NOTIFICATIONS: usize = 100;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum NotificationType {
    Info,
    Success,
    Warning,
    Error,
    Sale,
    Sync,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum NotificationPriority {
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationAction {
    pub label: String,
    pub action_type: String,
    pub payload: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppNotification {
    pub id: String,
    pub notification_type: NotificationType,
    pub priority: NotificationPriority,
    pub title: String,
    pub body: String,
    pub timestamp: DateTime<Utc>,
    pub read: bool,
    pub persistent: bool,
    pub action: Option<NotificationAction>,
    pub sound_enabled: bool,
}

impl AppNotification {
    pub fn new(
        notification_type: NotificationType,
        priority: NotificationPriority,
        title: String,
        body: String,
    ) -> Self {
        Self {
            id: uuid::Uuid::now_v7().to_string(),
            notification_type,
            priority,
            title,
            body,
            timestamp: Utc::now(),
            read: false,
            persistent: true,
            action: None,
            sound_enabled: true,
        }
    }
}

pub struct NotificationState {
    notifications: RwLock<Vec<AppNotification>>,
}

impl NotificationState {
    pub fn new() -> Self {
        Self {
            notifications: RwLock::new(Vec::new()),
        }
    }

    pub fn add_notification(&self, notification: AppNotification) {
        let mut notifications = self.notifications.write().unwrap_or_else(|e| e.into_inner());
        if notifications.iter().any(|n| n.id == notification.id) { return; }
        notifications.insert(0, notification);
        if notifications.len() > MAX_NOTIFICATIONS { notifications.truncate(MAX_NOTIFICATIONS); }
    }

    pub fn get_all(&self) -> Vec<AppNotification> {
        self.notifications.read().unwrap_or_else(|e| e.into_inner()).clone()
    }
}

async fn get_db_pool(app: &AppHandle) -> Option<SqlitePool> {
    let instances = app.state::<DbInstances>();
    let guard = instances.0.read().await;
    guard.get(MAIN_DB_NAME).map(|p| match p {
        DbPool::Sqlite(pool) => pool.clone(),
    })
}

pub async fn save_notification_to_db(app: &AppHandle, notification: &AppNotification) {
    if let Some(pool) = get_db_pool(app).await {
        let _ = sqlx::query("INSERT OR REPLACE INTO notifications (id, payload, timestamp, is_read) VALUES (?1, ?2, ?3, ?4)")
            .bind(&notification.id)
            .bind(serde_json::to_string(notification).unwrap_or_default())
            .bind(notification.timestamp.to_rfc3339())
            .bind(notification.read)
            .execute(&pool)
            .await;
    }
}

pub async fn init_notification_state(app: &AppHandle, state: &NotificationState) {
    let pool = match get_db_pool(app).await { Some(p) => p, None => return };

    let _ = sqlx::query("CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, payload TEXT, timestamp TEXT, is_read BOOLEAN)").execute(&pool).await;

    // Load from DB
    if let Ok(rows) = sqlx::query("SELECT payload FROM notifications ORDER BY timestamp DESC LIMIT ?1").bind(MAX_NOTIFICATIONS as i32).fetch_all(&pool).await {
        let mut notifications = state.notifications.write().unwrap_or_else(|e| e.into_inner());
        for row in rows {
            if let Ok(n) = serde_json::from_str::<AppNotification>(&row.get::<String, _>("payload")) {
                notifications.push(n);
            }
        }
    }
}

#[tauri::command]
pub async fn send_native_notification(
    app: AppHandle,
    state: tauri::State<'_, NotificationState>,
    notification: AppNotification,
) -> Result<String, String> {
    use tauri_plugin_notification::NotificationExt;
    let id = notification.id.clone();
    state.add_notification(notification.clone());
    save_notification_to_db(&app, &notification).await;

    let _ = app.notification().builder().title(&notification.title).body(&notification.body).show();
    let _ = app.emit("notification-received", &notification);
    let _ = app.emit("notification-badge-update", state.notifications.read().unwrap().iter().filter(|n| !n.read).count());
    Ok(id)
}

#[tauri::command]
pub fn get_notification_history(state: tauri::State<'_, NotificationState>) -> Vec<AppNotification> {
    state.get_all()
}

#[tauri::command]
pub fn get_unread_notification_count(state: tauri::State<'_, NotificationState>) -> usize {
    state.notifications.read().unwrap().iter().filter(|n| !n.read).count()
}

#[tauri::command]
pub async fn mark_notification_read(app: AppHandle, state: tauri::State<'_, NotificationState>, id: String) -> Result<bool, String> {
    let (n_to_update, unread_count) = {
        let mut notifications = state.notifications.write().unwrap();
        if let Some(n) = notifications.iter_mut().find(|n| n.id == id) {
            n.read = true;
            (Some(n.clone()), notifications.iter().filter(|n| !n.read).count())
        } else {
            (None, 0)
        }
    };

    if let Some(n) = n_to_update {
        if let Some(pool) = get_db_pool(&app).await {
            let _ = sqlx::query("UPDATE notifications SET is_read = 1, payload = ?1 WHERE id = ?2")
                .bind(serde_json::to_string(&n).unwrap_or_default()).bind(&id).execute(&pool).await;
        }
        let _ = app.emit("notification-badge-update", unread_count);
        return Ok(true);
    }
    Ok(false)
}

#[tauri::command]
pub async fn mark_all_notifications_read(app: AppHandle, state: tauri::State<'_, NotificationState>) -> Result<(), String> {
    let updated_notifications = {
        let mut notifications = state.notifications.write().unwrap();
        for n in notifications.iter_mut() { n.read = true; }
        notifications.clone()
    };

    if let Some(pool) = get_db_pool(&app).await {
        let _ = sqlx::query("UPDATE notifications SET is_read = 1").execute(&pool).await;
        for n in updated_notifications {
             let _ = sqlx::query("UPDATE notifications SET payload = ?1 WHERE id = ?2").bind(serde_json::to_string(&n).unwrap_or_default()).bind(&n.id).execute(&pool).await;
        }
    }
    let _ = app.emit("notification-badge-update", 0);
    Ok(())
}

#[tauri::command]
pub async fn delete_notification(app: AppHandle, state: tauri::State<'_, NotificationState>, id: String) -> Result<bool, String> {
    let (found, unread_count) = {
        let mut notifications = state.notifications.write().unwrap();
        if let Some(pos) = notifications.iter().position(|n| n.id == id) {
            notifications.remove(pos);
            (true, notifications.iter().filter(|n| !n.read).count())
        } else {
            (false, 0)
        }
    };

    if found {
        if let Some(pool) = get_db_pool(&app).await {
            let _ = sqlx::query("DELETE FROM notifications WHERE id = ?1").bind(&id).execute(&pool).await;
        }
        let _ = app.emit("notification-badge-update", unread_count);
        return Ok(true);
    }
    Ok(false)
}

#[tauri::command]
pub async fn clear_all_notifications(app: AppHandle, state: tauri::State<'_, NotificationState>) -> Result<(), String> {
    state.notifications.write().unwrap().clear();
    if let Some(pool) = get_db_pool(&app).await {
        let _ = sqlx::query("DELETE FROM notifications").execute(&pool).await;
    }
    let _ = app.emit("notification-badge-update", 0);
    Ok(())
}
