use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: "
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    role TEXT,
                    last_login DATETIME
                );

                CREATE TABLE IF NOT EXISTS bakery_settings (
                    id TEXT PRIMARY KEY,
                    organization_id TEXT NOT NULL,
                    is_enabled BOOLEAN DEFAULT 1,
                    default_location_id TEXT,
                    default_baker_id TEXT,
                    auto_create_daily_batches BOOLEAN DEFAULT 0,
                    expiry_warning_days INTEGER DEFAULT 7,
                    auth_mode TEXT DEFAULT 'SSO',
                    api_key TEXT,
                    batch_prefix TEXT DEFAULT 'BAT',
                    batch_separator TEXT DEFAULT '-',
                    batch_date_format TEXT DEFAULT 'YYYYMMDD',
                    batch_sequence TEXT DEFAULT '4',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS bakers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    role TEXT,
                    member_id TEXT,
                    email TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    bakery_settings_id TEXT,
                    organization_id TEXT NOT NULL DEFAULT 'local-org',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(bakery_settings_id) REFERENCES bakery_settings(id)
                );

                CREATE TABLE IF NOT EXISTS bakery_categories (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    organization_id TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS recipes (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    category_id TEXT,
                    produces_variant_id TEXT NOT NULL,
                    yield_quantity REAL NOT NULL,
                    yield_unit TEXT NOT NULL,
                    prep_time INTEGER,
                    bake_time INTEGER,
                    difficulty TEXT,
                    instructions TEXT,
                    organization_id TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS ingredients (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    sku TEXT,
                    category_id TEXT,
                    current_stock REAL DEFAULT 0,
                    reorder_level REAL DEFAULT 0,
                    max_stock REAL DEFAULT 0,
                    unit_id TEXT,
                    unit_price REAL DEFAULT 0,
                    last_restocked DATETIME,
                    total_used REAL DEFAULT 0,
                    average_usage_per_week REAL DEFAULT 0,
                    organization_id TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(category_id) REFERENCES bakery_categories(id)
                );

                CREATE TABLE IF NOT EXISTS recipe_ingredients (
                    id TEXT PRIMARY KEY,
                    recipe_id TEXT NOT NULL,
                    ingredient_variant_id TEXT NOT NULL,
                    quantity REAL NOT NULL,
                    unit TEXT,
                    FOREIGN KEY(recipe_id) REFERENCES recipes(id),
                    FOREIGN KEY(ingredient_variant_id) REFERENCES ingredients(id)
                );

                CREATE TABLE IF NOT EXISTS batches (
                    id TEXT PRIMARY KEY,
                    number TEXT NOT NULL,
                    name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    recipe_id TEXT NOT NULL,
                    planned_date DATETIME NOT NULL,
                    planned_quantity REAL NOT NULL,
                    actual_quantity REAL,
                    completed_quantity REAL,
                    started_at DATETIME,
                    completed_at DATETIME,
                    cancelled_at DATETIME,
                    organization_id TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS system_units (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    type TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'UNIVERSAL',
                    is_base_unit BOOLEAN DEFAULT 0,
                    is_metric BOOLEAN DEFAULT 1,
                    is_active BOOLEAN DEFAULT 1
                );

                CREATE TABLE IF NOT EXISTS organization_units (
                    id TEXT PRIMARY KEY,
                    organization_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    type TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'UNIVERSAL',
                    description TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    base_system_unit_id TEXT,
                    conversion_factor REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS templates (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    recipe_id TEXT NOT NULL,
                    quantity REAL NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    organization_id TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS activity_logs (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    entity_type TEXT,
                    entity_id TEXT,
                    details TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS sync_queue (
                    id TEXT PRIMARY KEY,
                    action TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    synced_at DATETIME
                );

                CREATE TABLE IF NOT EXISTS batch_ingredients (
                    id TEXT PRIMARY KEY,
                    batch_id TEXT NOT NULL,
                    ingredient_id TEXT NOT NULL,
                    quantity_used REAL NOT NULL,
                    unit TEXT,
                    lot_number TEXT,
                    FOREIGN KEY(batch_id) REFERENCES batches(id),
                    FOREIGN KEY(ingredient_id) REFERENCES ingredients(id)
                );

                CREATE TABLE IF NOT EXISTS batch_process_logs (
                    id TEXT PRIMARY KEY,
                    batch_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    details TEXT,
                    performed_by TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(batch_id) REFERENCES batches(id)
                );

                CREATE TABLE IF NOT EXISTS batch_quality_checks (
                    id TEXT PRIMARY KEY,
                    batch_id TEXT NOT NULL,
                    check_name TEXT NOT NULL,
                    result TEXT NOT NULL,
                    notes TEXT,
                    performed_by TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(batch_id) REFERENCES batches(id)
                );

                -- Seed initial settings if not present
                INSERT OR IGNORE INTO bakery_settings (id, organization_id, is_enabled, auth_mode)
                VALUES ('default-settings', 'local-org', 1, 'LOCAL');
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_local_auth_to_users",
            sql: "
                ALTER TABLE users ADD COLUMN password_hash TEXT;

                -- Seed default admin user for local mode
                INSERT OR IGNORE INTO users (id, name, email, password_hash, role)
                VALUES ('local-admin', 'Bakery Admin', 'admin@bakery.local', '$2b$10$KYXi5mAP86C5tu6cLrJOCOvn/M5M7z6UG7F5tEdzVhpu8Z7frTV.O', 'ADMIN');
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_missing_unit_fields",
            sql: "
                ALTER TABLE system_units ADD COLUMN abbreviation TEXT;
                ALTER TABLE system_units ADD COLUMN plural_name TEXT;
                ALTER TABLE system_units ADD COLUMN description TEXT;
                ALTER TABLE system_units ADD COLUMN sort_order INTEGER;
                ALTER TABLE system_units ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
                ALTER TABLE system_units ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

                ALTER TABLE organization_units ADD COLUMN abbreviation TEXT;
                ALTER TABLE organization_units ADD COLUMN plural_name TEXT;
                ALTER TABLE organization_units ADD COLUMN conversion_offset REAL DEFAULT 0;

                CREATE TABLE IF NOT EXISTS organizations (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    slug TEXT UNIQUE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                -- Also ensure existing tables have some values for the new timestamp columns if needed
                UPDATE system_units SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_api_endpoint_url_to_settings",
            sql: "
                ALTER TABLE bakery_settings ADD COLUMN api_endpoint_url TEXT;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_card_id_and_pin_to_bakers",
            sql: "
                ALTER TABLE bakers ADD COLUMN card_id TEXT;
                ALTER TABLE bakers ADD COLUMN pin_hash TEXT;
            ",
            kind: MigrationKind::Up,
        }
    ]
}
