use sqlx::{Pool, Sqlite, Row};
use chrono::Utc;
use crate::models::Shift;
use crate::stores::shift_store::generate_z_report_text;

async fn setup_shift_test_db() -> Pool<Sqlite> {
    let pool = Pool::connect("sqlite::memory:").await.unwrap();

    sqlx::query(r#"
        CREATE TABLE shifts (
            id TEXT PRIMARY KEY,
            opened_at TEXT,
            closed_at TEXT,
            operator_id TEXT,
            closing_operator_id TEXT,
            operator_card_id TEXT,
            operator_pin TEXT,
            starting_float REAL,
            total_cash_sales REAL,
            total_cash_drops REAL,
            total_cash_refunds REAL,
            expected_cash REAL,
            actual_cash REAL,
            variance REAL,
            opening_cash_details TEXT,
            closing_cash_details TEXT,
            device_id TEXT,
            is_synced BOOLEAN DEFAULT 0
        )
    "#).execute(&pool).await.unwrap();

    pool
}

#[test]
fn test_shift_initialization() {
    let shift = Shift {
        id: "shift-123".to_string(),
        opened_at: Utc::now(),
        closed_at: None,
        operator_id: Some("op-abc".to_string()),
        closing_operator_id: None,
        starting_float: 100.0,
        total_cash_sales: 0.0,
        total_cash_drops: 0.0,
        total_cash_refunds: 0.0,
        expected_cash: 100.0,
        actual_cash: None,
        variance: None,
        opening_cash_details: None,
        closing_cash_details: None,
        operator_card_id: Some("op-abc".to_string()),
        operator_pin: Some("pin-123".to_string()),
        device_id: Some("dev-001".to_string()),
    };

    assert_eq!(shift.id, "shift-123");
    assert_eq!(shift.starting_float, 100.0);
    assert_eq!(shift.expected_cash, 100.0);
    assert!(shift.closed_at.is_none());
}

#[test]
fn test_cash_sale_expected_cash() {
    let mut shift = Shift {
        id: "shift-123".to_string(),
        opened_at: Utc::now(),
        closed_at: None,
        operator_id: Some("op-abc".to_string()),
        closing_operator_id: None,
        starting_float: 100.0,
        total_cash_sales: 0.0,
        total_cash_drops: 0.0,
        total_cash_refunds: 0.0,
        expected_cash: 100.0,
        actual_cash: None,
        variance: None,
        opening_cash_details: None,
        closing_cash_details: None,
        operator_card_id: Some("op-abc".to_string()),
        operator_pin: Some("pin-123".to_string()),
        device_id: Some("dev-001".to_string()),
    };

    // Record a cash sale of 45.50
    shift.total_cash_sales += 45.50;
    shift.expected_cash += 45.50;

    assert_eq!(shift.total_cash_sales, 45.50);
    assert_eq!(shift.expected_cash, 145.50);
}

#[test]
fn test_cash_drop_expected_cash() {
    let mut shift = Shift {
        id: "shift-123".to_string(),
        opened_at: Utc::now(),
        closed_at: None,
        operator_id: Some("op-abc".to_string()),
        closing_operator_id: None,
        starting_float: 100.0,
        total_cash_sales: 50.0,
        total_cash_drops: 0.0,
        total_cash_refunds: 0.0,
        expected_cash: 150.0,
        actual_cash: None,
        variance: None,
        opening_cash_details: None,
        closing_cash_details: None,
        operator_card_id: Some("op-abc".to_string()),
        operator_pin: Some("pin-123".to_string()),
        device_id: Some("dev-001".to_string()),
    };

    // Perform a cash drop of 20.00 (e.g. payout or safe drop)
    shift.total_cash_drops += 20.00;
    shift.expected_cash -= 20.00;

    assert_eq!(shift.total_cash_drops, 20.00);
    assert_eq!(shift.expected_cash, 130.00);
}

#[test]
fn test_shift_closure_variance() {
    let mut shift = Shift {
        id: "shift-123".to_string(),
        opened_at: Utc::now(),
        closed_at: None,
        operator_id: Some("op-abc".to_string()),
        closing_operator_id: None,
        starting_float: 100.0,
        total_cash_sales: 150.0,
        total_cash_drops: 10.0,
        total_cash_refunds: 0.0,
        expected_cash: 240.0,
        actual_cash: None,
        variance: None,
        opening_cash_details: None,
        closing_cash_details: None,
        operator_card_id: Some("op-abc".to_string()),
        operator_pin: Some("pin-123".to_string()),
        device_id: Some("dev-001".to_string()),
    };

    // Close with actual cash count of 238.50 (variance of -1.50)
    shift.closed_at = Some(Utc::now());
    shift.actual_cash = Some(238.50);
    shift.variance = Some(238.50 - shift.expected_cash);

    assert_eq!(shift.actual_cash, Some(238.50));
    assert_eq!(shift.variance, Some(-1.50));
}

#[test]
fn test_z_report_generation() {
    let shift = Shift {
        id: "shift-12345678-abc".to_string(),
        opened_at: Utc::now(),
        closed_at: Some(Utc::now()),
        operator_id: Some("OperatorJohn".to_string()),
        closing_operator_id: None,
        starting_float: 150.0,
        total_cash_sales: 320.0,
        total_cash_drops: 40.0,
        total_cash_refunds: 10.0,
        expected_cash: 420.0,
        actual_cash: Some(418.50),
        variance: Some(-1.50),
        opening_cash_details: None,
        closing_cash_details: None,
        operator_card_id: Some("OperatorJohn".to_string()),
        operator_pin: Some("pin-123".to_string()),
        device_id: Some("dev-001".to_string()),
    };

    let report = generate_z_report_text(&shift);
    assert!(report.contains("Z-REPORT"));
    assert!(report.contains("John"));
    assert!(report.contains("OPENING FLOAT:      150.00"));
    assert!(report.contains("(+) CASH SALES:     320.00"));
    assert!(report.contains("(-) DROPS/PAYOUTS:  40.00"));
    assert!(report.contains("(-) REFUNDS:        10.00"));
    assert!(report.contains("EXPECTED CASH:      420.00"));
    assert!(report.contains("ACTUAL COUNT:       418.50"));
    assert!(report.contains("VARIANCE:           -1.50"));
}

#[tokio::test]
async fn test_shift_db_persistence() {
    let pool = setup_shift_test_db().await;

    let shift = Shift {
        id: "shift-789".to_string(),
        opened_at: Utc::now(),
        closed_at: None,
        operator_id: Some("operator-456".to_string()),
        closing_operator_id: None,
        starting_float: 250.0,
        total_cash_sales: 0.0,
        total_cash_drops: 0.0,
        total_cash_refunds: 0.0,
        expected_cash: 250.0,
        actual_cash: None,
        variance: None,
        opening_cash_details: None,
        closing_cash_details: None,
        operator_card_id: Some("operator-456".to_string()),
        operator_pin: Some("pin-hash".to_string()),
        device_id: Some("device-abc".to_string()),
    };

    // Insert
    sqlx::query("INSERT INTO shifts (id, opened_at, operator_id, operator_card_id, operator_pin, starting_float, total_cash_sales, total_cash_drops, total_cash_refunds, expected_cash, device_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)")
        .bind(&shift.id)
        .bind(shift.opened_at.to_rfc3339())
        .bind(&shift.operator_id)
        .bind(&shift.operator_card_id)
        .bind(&shift.operator_pin)
        .bind(shift.starting_float)
        .bind(0.0)
        .bind(0.0)
        .bind(0.0)
        .bind(shift.expected_cash)
        .bind(&shift.device_id)
        .execute(&pool)
        .await
        .unwrap();

    // Query
    let row = sqlx::query("SELECT * FROM shifts WHERE id = 'shift-789'")
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(row.get::<String, _>("id"), "shift-789");
    assert_eq!(row.get::<String, _>("operator_id"), "operator-456");
    assert_eq!(row.get::<f64, _>("starting_float"), 250.0);
    assert_eq!(row.get::<f64, _>("expected_cash"), 250.0);
}
