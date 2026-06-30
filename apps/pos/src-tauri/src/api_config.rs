// src-tauri/src/api_config.rs

pub mod routes {
    // --- Auth ---
    pub const CHECK_IN: &str = "api/v2/members/login";
    pub const CHECK_OUT: &str = "api/v2/pos/check-out";
    pub const LOCATIONS: &str = "api/v2/pos/locations";
    pub const ABLY_AUTH: &str = "api/v2/pos/ably-auth";
    pub const MPESA_INITIATE: &str = "api/v2/payments/mpesa/stkpush";
    // pub const DEVICE_REGISTER: &str = "api/v2/devices/register";

    // --- Inventory / Stock ---
    pub const INVENTORY_TRANSFERS: &str = "api/v2/pos/inventory/transfers";
    pub const INVENTORY_REQUESTS: &str = "api/v2/pos/inventory/requests";
    pub const INVENTORY_PROCESS: &str = "api/v2/pos/inventory/process";
    pub const INCOMING_SHIPMENTS: &str = "api/v2/pos/incoming";

    pub fn purchase_receive(id: &str) -> String {
        format!("api/v2/pos/purchases/{}/receive", id)
    }

    pub fn transfer_receive(id: &str) -> String {
        format!("api/v2/pos/inventory/transfers/{}/receive", id)
    }

    // --- Sales ---
    pub const SALE_PROCESS: &str = "api/v2/pos/sale";
    pub const SALE_BASE: &str = "api/v2/pos/sale";
    pub const SALE_PAYMENTS: &str = "api/v2/pos/sale/payments";
    pub const TRANSACTION_SCAN: &str = "api/v2/pos/transaction/scan";
    pub const ORDERS: &str = "api/v2/pos/orders";

    // --- Products & Pricing ---
    pub const PRODUCTS: &str = "api/v2/pos/products";
    pub const PRICING: &str = "api/v2/pos/pricing";
    pub const PRICING_SYNC: &str = "api/v2/pos/pricing/sync";

    // --- Customers ---
    pub const CUSTOMERS: &str = "api/v2/pos/customers";

    // --- Shifts ---
    pub const SHIFT_SYNC: &str = "api/v2/pos/shifts/sync";

    // --- Delivery ---
    pub const DRIVERS: &str = "api/v2/pos/drivers";
    pub const DELIVERY_DISPATCH: &str = "api/v2/pos/deliveries/dispatch";
    pub const DELIVERY_RECONCILE: &str = "api/v2/pos/deliveries/reconcile-pod";

    // --- Upload ---
    pub const UPLOAD: &str = "api/v2/upload";
}
