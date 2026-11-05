# Managing Product Variants

Product variants represent the specific versions of a product sold to customers—differing by attributes such as size, color, weight, material, or packaging.

## 1. Overview of Variants in Scryme

Every newly created product starts with a **Default Variant**. When an item is available in multiple variations, operators can add distinct variants to ensure accurate stock counting, barcode scanning, and individual pricing.

Each variant maintains its own:
- Dedicated SKU and Barcode
- Cost (Buying) and Retail Selling Price
- Attribute definitions (JSON matrix)
- Reorder Point & Reorder Quantity
- Expiry Tracking and Serial Number controls
- Location-specific inventory levels

---

## 2. Adding a New Variant

1. Go to **Inventory** > click on your target product to open `/inventory/products/[id]`.
2. Select the **Variants** tab.
3. Click the **Add Variant** button in the card header.
4. The **Add New Variant** dialog opens.

### Field Breakdown

| Field | Description | Example |
|---|---|---|
| **Variant Name** | Descriptive label combining key attributes | `Large / Red` |
| **SKU** | Unique variant SKU (auto-suggests `<base-sku>-<index>`) | `ART-48291-2` |
| **Barcode** | 12 or 13-digit barcode (EAN, UPC, or custom) | `079357318921` |
| **Buying Price** | Cost of acquisition for this specific variant | `$3.50` |
| **Retail Price** | Selling price for this specific variant | `$6.99` |
| **Wholesale / Promo** | Optional discounted or business pricing tiers | `$5.50` |
| **Initial Stock** | Initial physical count to receive into the default location | `25` |

---

## 3. Hardware Barcode Scanner Integration

Scryme features built-in support for USB and Bluetooth physical hardware barcode scanners:

### How Scanner Listening Works

1. While the **Add Variant** or **Edit Variant** dialog is open, a green status badge indicates:
   $$\text{🟢 Scanner Ready}$$
2. Point your physical handheld scanner at any barcode and trigger the scan.
3. The dashboard detects input events arriving in bursts with less than **45 milliseconds** between keystrokes.
4. The scanner automatically captures the code, populates the **Barcode** field, prevents accidental form submission, and triggers a confirmation notification (`Barcode scanned: <code_value>`).
5. If no physical barcode exists, click **(Generate)** next to the label to generate a random 12-digit code for internal store labeling.

---

## 4. Custom Attributes Matrix

Under the **Variant Attributes** section, operators can attach key-value pairs to represent item characteristics:

1. Click **+ Add** next to Variant Attributes.
2. Enter the attribute name (e.g., `Size`, `Color`, `Flavor`, or `Material`).
3. Enter the corresponding value in the text input (e.g., `500g`, `Navy Blue`, `Whole Wheat`).
4. To remove an attribute, click the red trash icon next to the row.

---

## 5. Expiration & Serial Number Tracking

Under **Expiration & Serial Tracking**:

- **Expiry Tracking (Checkbox)**:
  - Check this for perishable foods, bakery items, or pharmaceuticals.
  - **Warning Days**: Number of days before the expiration date to trigger low-shelf-life dashboard alerts (default: `2` days).
  - **Shelf Life Days**: Default shelf life duration from the date the batch is received into stock.
- **Serial Tracking (Checkbox)**:
  - Check this for electronics, serialized machinery, or high-value items requiring unique tracking per unit.
  - When enabled, stock adjustments and sales require entering or scanning individual serial numbers.

---

## 6. Bulk Variant Actions & Safeguards

The **Variants Tab** provides bulk operations for high-velocity stores:

### Activating / Deactivating Variants
- Select one or more variants using the checkboxes in the table.
- Click **Mark Active** to enable the selected variants across store points of sale.
- Individual variants can be toggled inactive in their edit dialog if temporarily unavailable.

### Deletion Safeguards
- To delete a variant, click the dropdown menu (`···`) on the table row and select **Delete**, or select multiple checkboxes and click **Delete Selected**.
- **Protection Rule**: A product **must have at least one variant**. The system automatically disables the delete button if only one variant remains.
- If a variant has historical sales or purchase orders, the database prevents hard deletion to maintain financial audit integrity. In such cases, mark the variant **Inactive** rather than deleting it.
