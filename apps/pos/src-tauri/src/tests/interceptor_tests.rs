use crate::models::ServerPricingResponse;
use crate::stores::delivery_store::Driver;
use crate::stock_acceptance_models::IncomingResponse;
use crate::models::ProductsSyncResponse;

#[test]
fn test_pricing_response_interceptor_unwrapping() {
    let raw_wrapped = serde_json::json!({
        "success": true,
        "data": {
            "metadata": {
                "syncedAt": "2026-03-30T10:00:00Z",
                "isDelta": false
            },
            "data": {
                "lists": [{
                    "id": "list_1",
                    "code": "RETAIL",
                    "priority": 1,
                    "isGlobal": true,
                    "isActive": true,
                    "validFrom": null,
                    "validTo": null,
                    "updatedAt": "2026-03-30T10:00:00Z"
                }],
                "items": [],
                "customerAllocations": null,
                "deletedItemIds": []
            }
        },
        "timestamp": "2026-03-30T10:00:00Z"
    });

    let target = if let Some(data) = raw_wrapped.get("data") {
        if data.get("metadata").is_some() || data.get("data").is_some() {
            data
        } else {
            &raw_wrapped
        }
    } else {
        &raw_wrapped
    };

    let parsed: ServerPricingResponse = serde_json::from_value(target.clone()).unwrap();
    assert_eq!(parsed.metadata.synced_at, "2026-03-30T10:00:00Z");
    assert_eq!(parsed.data.lists.len(), 1);
    assert_eq!(parsed.data.lists[0].id, "list_1");

    // Test flat response fallback
    let raw_flat = serde_json::json!({
        "metadata": {
            "syncedAt": "2026-03-30T11:00:00Z",
            "isDelta": true
        },
        "data": {
            "lists": [],
            "items": [],
            "deletedItemIds": []
        }
    });

    let target_flat = if let Some(data) = raw_flat.get("data") {
        if data.get("metadata").is_some() || data.get("data").is_some() {
            data
        } else {
            &raw_flat
        }
    } else {
        &raw_flat
    };

    let parsed_flat: ServerPricingResponse = serde_json::from_value(target_flat.clone()).unwrap();
    assert_eq!(parsed_flat.metadata.synced_at, "2026-03-30T11:00:00Z");
    assert!(parsed_flat.metadata.is_delta);
}

#[test]
fn test_driver_response_interceptor_unwrapping() {
    let raw_wrapped = serde_json::json!({
        "success": true,
        "data": [
            {
                "id": "driver_1",
                "member": { "name": "John Driver" }
            }
        ],
        "timestamp": "2026-03-30T10:00:00Z"
    });

    let target = if let Some(data) = raw_wrapped.get("data") {
        if data.is_array() {
            data
        } else {
            &raw_wrapped
        }
    } else {
        &raw_wrapped
    };

    let drivers: Vec<Driver> = serde_json::from_value(target.clone()).unwrap();
    assert_eq!(drivers.len(), 1);
    assert_eq!(drivers[0].id, "driver_1");
    assert_eq!(drivers[0].member.name, "John Driver");

    // Test flat response
    let raw_flat = serde_json::json!([
        {
            "id": "driver_2",
            "member": { "name": "Jane Driver" }
        }
    ]);

    let target_flat = if let Some(data) = raw_flat.get("data") {
        if data.is_array() {
            data
        } else {
            &raw_flat
        }
    } else {
        &raw_flat
    };

    let drivers_flat: Vec<Driver> = serde_json::from_value(target_flat.clone()).unwrap();
    assert_eq!(drivers_flat.len(), 1);
    assert_eq!(drivers_flat[0].id, "driver_2");
}

#[test]
fn test_sales_history_interceptor_unwrapping() {
    let raw_wrapped = serde_json::json!({
        "success": true,
        "data": [
            { "id": "sale_101", "total": 500.0 }
        ],
        "timestamp": "2026-03-30T10:00:00Z"
    });

    let target = if let Some(data) = raw_wrapped.get("data") {
        data
    } else {
        &raw_wrapped
    };

    let sales: Vec<serde_json::Value> = if let Some(arr) = target.as_array() {
        arr.clone()
    } else {
        vec![target.clone()]
    };

    assert_eq!(sales.len(), 1);
    assert_eq!(sales[0]["id"], "sale_101");
}

#[test]
fn test_stock_acceptance_incoming_response_unwrapping() {
    let raw_wrapped = serde_json::json!({
        "success": true,
        "data": {
            "data": []
        },
        "timestamp": "2026-03-30T10:00:00Z"
    });

    let target = if let Some(d) = raw_wrapped.get("data") {
        if !d.is_null() {
            d
        } else {
            &raw_wrapped
        }
    } else {
        &raw_wrapped
    };

    let parsed: IncomingResponse = serde_json::from_value(target.clone()).unwrap();
    assert_eq!(parsed.data.len(), 0);
}

#[test]
fn test_product_sync_response_unwrapping() {
    let raw_wrapped = serde_json::json!({
        "success": true,
        "data": {
            "products": []
        },
        "meta": {
            "syncTimestamp": "2026-03-30T12:00:00Z"
        },
        "timestamp": "2026-03-30T12:00:00Z"
    });

    let (res_body, sync_ts) = if let Ok(v3_resp) = serde_json::from_value::<crate::models::StandardResponse<ProductsSyncResponse>>(raw_wrapped.clone()) {
        let ts = v3_resp.meta.and_then(|m| m.get("syncTimestamp").and_then(|t| t.as_str().map(|s| s.to_string())));
        (v3_resp.data, ts)
    } else if let Some(d) = raw_wrapped.get("data") {
        let ts = raw_wrapped.get("meta").and_then(|m| m.get("syncTimestamp").and_then(|t| t.as_str().map(|s| s.to_string())));
        let parsed: ProductsSyncResponse = serde_json::from_value(d.clone()).unwrap();
        (parsed, ts)
    } else {
        let parsed: ProductsSyncResponse = serde_json::from_value(raw_wrapped.clone()).unwrap();
        (parsed, None)
    };

    assert_eq!(res_body.products.len(), 0);
    assert_eq!(sync_ts, Some("2026-03-30T12:00:00Z".to_string()));
}
