# Updating Details & Multi-Unit Pricing

This guide covers editing existing products, configuring multi-tier selling units, managing price lists, and establishing location-based automated replenishment rules.

## 1. Updating Product Information

1. Navigate to `/inventory/products/[id]`.
2. The **Overview** tab lets you edit:
   - **Product Name** & **URL Slug** (click *Regenerate* to synchronize slug if title changes).
   - **Category**: Reassign item to a new parent or subcategory.
   - **Detailed Description**: Markdown editor for rich customer-facing details.
   - **Tags & Organization**: Add searchable tags in the right-hand panel (e.g., `organic`, `gluten-free`, `seasonal`).
3. Click the sticky **Save Changes** button at the top-right to commit updates.

---

## 2. Multi-Unit Conversions (Units Tab)

Many retail businesses purchase items in bulk units (e.g., cartons, sacks, or boxes) but sell them either individually or in varying pack sizes.

In the **Units** tab:
- **Base Unit**: The primary indivisible unit tracked in stock (e.g., `Piece`, `Gram`, `Milliliter`).
- **Stocking Unit**: The standard packaging unit used when receiving Purchase Orders from suppliers.
- **Selling Units (`VariantSellingUnit`)**: Custom packaging configurations with automated conversion multipliers and distinct prices:

### Example: Selling Bread or Beverages

| Unit Name | Type | Multiplier | Retail Price | Description |
|---|---|---|---|---|
| **Piece (pc)** | Base Unit | `1.0` | `$2.00` | Single unit sale |
| **Pack of 6** | Custom Unit | `6.0` | `$10.50` | Volume discount bundle |
| **Case (24 pcs)** | Custom Unit | `24.0` | `$38.00` | Wholesale or catering tier |

When a POS cashier sells a "Pack of 6", the inventory engine automatically deducts 6 base units from the on-hand stock batch without requiring manual calculation.

---

## 3. Pricing Rules & Price Lists (Pricing Tab)

The **Pricing & Rules** tab allows configuring customer-group pricing:

- **Price Lists**:
  - Assign specific retail or wholesale price tiers (e.g., `VIP Customers`, `Contract Wholesalers`).
- **Volume Discounts**:
  - Set minimum quantity tiers (e.g., "Buy 5+ units for $4.50 each instead of $5.00").
- **Promotional Pricing**:
  - Set temporary promotional prices with start and end dates.

---

## 4. Reorder Rules & Suppliers (Inventory & Suppliers Tabs)

To prevent stockouts, configure automated reordering per inventory location:

### Configuring Reorder Rules

1. Open the **Stock & Locations** tab.
2. Under **Reorder Points by Location**, configure:
   - **Minimum Quantity**: Threshold when low-stock alerts are triggered.
   - **Reorder Quantity**: Default order amount added to generated Purchase Orders.
   - **Maximum Quantity**: Capacity ceiling to avoid overstocking storage units.
   - **Auto-Generate**: When enabled, the system automatically drafts a PO to the assigned preferred supplier once stock falls below the minimum.

### Linking Suppliers

1. Open the **Suppliers** tab.
2. Click **Link Supplier**.
3. Select your partner supplier, enter their specific **Supplier SKU**, contract **Cost Price**, and **Lead Time (Days)**.
4. Toggle **Preferred Supplier** to make this supplier the default recipient for automatic restocking.
