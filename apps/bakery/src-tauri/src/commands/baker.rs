use crate::commands::{log_activity, serde_json_to_string};
use crate::error::{BackendError, BackendResult};
use crate::models::{Baker, User};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn login_staff(
    pool: State<'_, SqlitePool>,
    card_id: String,
    pin: String,
) -> BackendResult<Baker> {
    let baker = sqlx::query_as::<_, Baker>("SELECT * FROM bakers WHERE card_id = ? LIMIT 1")
        .bind(&card_id)
        .fetch_optional(&*pool)
        .await?
        .ok_or_else(|| BackendError::Auth("Invalid card ID or PIN".to_string()))?;

    let pin_hash = baker.pin_hash.as_ref().ok_or_else(|| {
        BackendError::Auth("Baker does not have a PIN set".to_string())
    })?;

    if !verify(&pin, pin_hash).map_err(|e| BackendError::Internal(e.to_string()))? {
        return Err(BackendError::Auth("Invalid card ID or PIN".to_string()));
    }

    if !baker.is_active {
        return Err(BackendError::Auth("Baker account is inactive".to_string()));
    }

    Ok(baker)
}

#[tauri::command]
pub async fn get_bakers(pool: State<'_, SqlitePool>) -> BackendResult<Vec<Baker>> {
    sqlx::query_as::<_, Baker>("SELECT * FROM bakers ORDER BY name ASC")
        .fetch_all(&*pool)
        .await
        .map_err(BackendError::from)
}

#[tauri::command]
pub async fn get_baker(pool: State<'_, SqlitePool>, id: String) -> BackendResult<Baker> {
    sqlx::query_as::<_, Baker>("SELECT * FROM bakers WHERE id = ?")
        .bind(id)
        .fetch_one(&*pool)
        .await
        .map_err(BackendError::from)
}

#[tauri::command]
pub async fn create_baker(
    pool: State<'_, SqlitePool>,
    user_id: String,
    mut baker: Baker,
) -> BackendResult<Baker> {
    baker.id = Uuid::new_v4().to_string();
    baker.created_at = Utc::now();
    baker.updated_at = Utc::now();

    if let Some(pin) = &baker.pin {
        let hashed = hash(pin, DEFAULT_COST).map_err(|e| BackendError::Internal(e.to_string()))?;
        baker.pin_hash = Some(hashed);
    }

    sqlx::query(
        "INSERT INTO bakers (id, name, role, member_id, card_id, pin_hash, email, is_active, bakery_settings_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&baker.id)
    .bind(&baker.name)
    .bind(&baker.role)
    .bind(&baker.member_id)
    .bind(&baker.card_id)
    .bind(&baker.pin_hash)
    .bind(&baker.email)
    .bind(baker.is_active)
    .bind(&baker.bakery_settings_id)
    .bind(baker.created_at)
    .bind(baker.updated_at)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "CREATE",
        "BAKER",
        &baker.id,
        Some("Added a new baker".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("CREATE")
        .bind("BAKER")
        .bind(&baker.id)
        .bind(serde_json_to_string(&baker)?)
        .execute(&*pool)
        .await?;

    Ok(baker)
}

#[tauri::command]
pub async fn update_baker(
    pool: State<'_, SqlitePool>,
    user_id: String,
    baker: serde_json.Value,
) -> BackendResult<()> {
    let id = baker["id"]
        .as_str()
        .ok_or_else(|| BackendError::Validation("Missing baker ID".to_string()))?;

    let pin_hash = if let Some(pin) = baker.get("pin").and_then(|v| v.as_str()) {
        Some(hash(pin, DEFAULT_COST).map_err(|e| BackendError::Internal(e.to_string()))?)
    } else {
        None
    };

    sqlx::query(
        "UPDATE bakers SET
         name = COALESCE(?, name),
         role = COALESCE(?, role),
         member_id = COALESCE(?, member_id),
         card_id = COALESCE(?, card_id),
         pin_hash = COALESCE(?, pin_hash),
         email = COALESCE(?, email),
         is_active = COALESCE(?, is_active),
         updated_at = ?
         WHERE id = ?",
    )
    .bind(baker.get("name").and_then(|v| v.as_str()))
    .bind(baker.get("role").and_then(|v| v.as_str()))
    .bind(baker.get("memberId").and_then(|v| v.as_str()))
    .bind(baker.get("cardId").and_then(|v| v.as_str()))
    .bind(pin_hash)
    .bind(baker.get("email").and_then(|v| v.as_str()))
    .bind(baker.get("isActive").and_then(|v| v.as_bool()))
    .bind(Utc::now())
    .bind(id)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "UPDATE",
        "BAKER",
        id,
        Some("Updated baker info".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("UPDATE")
        .bind("BAKER")
        .bind(id)
        .bind(serde_json_to_string(&baker)?)
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_baker(
    pool: State<'_, SqlitePool>,
    user_id: String,
    id: String,
) -> BackendResult<()> {
    sqlx::query("DELETE FROM bakers WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "DELETE",
        "BAKER",
        &id,
        Some("Removed baker".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("DELETE")
        .bind("BAKER")
        .bind(&id)
        .bind("{}")
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn login_user(pool: State<'_, SqlitePool>, email: String) -> BackendResult<User> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&*pool)
        .await?;

    match user {
        Some(u) => {
            sqlx::query("UPDATE users SET last_login = ? WHERE id = ?")
                .bind(Utc::now())
                .bind(&u.id)
                .execute(&*pool)
                .await?;
            Ok(u)
        }
        None => {
            // Auto-create user in local mode
            let id = Uuid::new_v4().to_string();
            let name = email.split('@').next().unwrap_or("Local User").to_string();
            let new_user = User {
                id: id.clone(),
                name,
                email: email.clone(),
                password_hash: None,
                role: Some("ADMIN".to_string()),
                last_login: Some(Utc::now()),
            };

            sqlx::query(
                "INSERT INTO users (id, name, email, role, last_login) VALUES (?, ?, ?, ?, ?)",
            )
            .bind(&new_user.id)
            .bind(&new_user.name)
            .bind(&new_user.email)
            .bind(&new_user.role)
            .bind(new_user.last_login)
            .execute(&*pool)
            .await?;

            Ok(new_user)
        }
    }
}
