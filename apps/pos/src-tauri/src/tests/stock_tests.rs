#[cfg(test)]
mod tests {
    use crate::stock_transfer::{TransferRequest, TransferItem, TransferApiPayload};
    use crate::stock_acceptance_models::{DeliveryItem, ReceivePurchaseRequest};

    #[test]
    fn test_transfer_payload_construction() {
        let item = TransferItem {
            variant_id: "v1".to_string(),
            quantity: 10,
        };
        let request = TransferRequest {
            to_location_id: "loc2".to_string(),
            items: vec![item.clone()],
            notes: Some("Test note".to_string()),
            documents: Some(vec!["doc1".to_string()]),
        };

        let api_payload = TransferApiPayload {
            from_location_id: "loc1".to_string(),
            to_location_id: request.to_location_id.clone(),
            items: request.items.clone(),
            notes: request.notes.clone(),
            documents: request.documents.clone(),
        };

        assert_eq!(api_payload.from_location_id, "loc1");
        assert_eq!(api_payload.to_location_id, "loc2");
        assert_eq!(api_payload.items.len(), 1);
        assert_eq!(api_payload.notes.unwrap(), "Test note");
        assert_eq!(api_payload.documents.unwrap().len(), 1);
    }

    #[test]
    fn test_receive_purchase_request_struct() {
        let item = DeliveryItem {
            variant_id: "v1".to_string(),
            quantity: 5,
            unit_cost: 100.0,
            purchase_item_id: Some("pi1".to_string()),
            received_quantity: Some(5.0),
            accepted_quantity: Some(5.0),
            rejected_quantity: Some(0.0),
            rejection_reason: None,
            batch_number: Some("B123".to_string()),
            expiry_date: Some("2025-12-31".to_string()),
            notes: None,
        };

        let request = ReceivePurchaseRequest {
            location_id: "loc1".to_string(),
            items: vec![item],
            notes: Some("Checked".to_string()),
        };

        assert_eq!(request.location_id, "loc1");
        assert_eq!(request.items[0].batch_number.as_ref().unwrap(), "B123");
    }
}
