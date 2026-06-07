// src-tauri/src/api_config.rs

pub mod routes {
    // --- Auth ---
    pub const PROVISION: &str = "pos/provision";
    pub const LOGIN: &str = "pos/login";
    pub const ME: &str = "pos/me";
    pub const CHECK_OUT: &str = "pos/check-out";
    pub const LOCATIONS: &str = "pos/locations";
    pub const ABLY_AUTH: &str = "pos/ably-auth";
    pub const MPESA_INITIATE: &str = "payments/mpesa/stkpush";

    // --- Inventory / Stock ---
    pub const TRANSFERS: &str = "pos/transfers";
    pub const REQUESTS: &str = "pos/requests";
    pub const INVENTORY_UNPACK: &str = "pos/inventory/unpack";
    pub const INVENTORY_PACK: &str = "pos/inventory/pack";

    pub fn transfer_ship(id: &str) -> String {
        format!("pos/transfers/{}/ship", id)
    }

    pub fn transfer_receive(id: &str) -> String {
        format!("pos/transfers/{}/receive", id)
    }

    // --- Sales & Transactions ---
    pub const SALE_PROCESS: &str = "pos/sale";
    pub const SALE_PAYMENTS: &str = "pos/sale/payments";
    pub const TRANSACTIONS: &str = "pos/transactions";
    pub const TRANSACTION_SCAN: &str = "pos/transaction/scan";

    // --- Sync ---
    pub const SYNC: &str = "pos/sync";
    pub const PRICING_SYNC: &str = "pos/pricing/sync";

    // --- Products & Pricing ---
    pub const PRICING: &str = "pos/pricing";

    // --- Finance ---
    pub const PETTY_CASH: &str = "pos/petty-cash";
    pub fn petty_cash_top_up(id: &str) -> String {
        format!("pos/petty-cash/{}/top-up", id)
    }
    pub fn petty_cash_expense(id: &str) -> String {
        format!("pos/petty-cash/{}/expense", id)
    }

    pub fn download_invoice(id: &str) -> String {
        format!("pos/finance/invoices/{}/download", id)
    }
    pub fn download_receipt(id: &str) -> String {
        format!("pos/finance/receipts/{}/download", id)
    }
    pub fn waybill(id: &str) -> String {
        format!("pos/waybill/{}", id)
    }

    // --- Delivery ---
    pub const DELIVERY_DISPATCH: &str = "pos/deliveries/dispatch";
    pub const DELIVERY_RECONCILE: &str = "pos/deliveries/reconcile-pod";

    // Legacy / V2 placeholders (if still needed temporarily during migration, but clean break requested)
    pub const PRODUCTS: &str = "pos/products";
    pub const CUSTOMERS: &str = "pos/customers";
}
