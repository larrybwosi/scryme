# Archiving, Disabling & Restoring Products

Managing catalog lifecycles requires understanding how to retire obsolete items without compromising past sales receipts, inventory movements, or tax reports.

## 1. Lifecycle State Comparison

Scryme provides four distinct states for catalog products:

| State | `isActive` | `isArchived` | Visibility in POS | Visibility in `/inventory` | Historical Data & Reports |
|---|---|---|---|---|---|
| **Active** | `true` | `false` | Visible | Visible (Normal) | Fully accessible |
| **Disabled (Inactive)** | `false` | `false` | Hidden | Visible (Marked Inactive) | Fully accessible |
| **Archived** | `false` | `true` | Hidden | Hidden (Moved to `/inventory/archived`) | Preserved in accounting & sales |
| **Deleted** | *N/A* | *N/A* | Removed | Removed | Erased (Blocked if sales exist) |

---

## 2. Disabling a Product (Temporary Deactivation)

Use **Disable** when an item is temporarily out of season, out of stock, or waiting on price changes:

### How to Disable

1. Go to the product page `/inventory/products/[id]`.
2. In the sticky top header, locate the status dropdown (next to the SKU badge).
3. Change the value from **Active** to **Inactive (Disabled)**.
4. Alternatively, click **Delete / Disable** in the top header and select **Disable Product**.
5. The product is immediately hidden from POS registers and digital sales channels, while remaining in your active items list for quick reactivation.

---

## 3. Archiving a Product (Soft Deletion)

Use **Archive** when an item is permanently discontinued, phased out, or replaced by a new model. Archiving removes clutter from your daily inventory views while keeping historic sales reports intact.

### How to Archive

1. Open `/inventory/products/[id]`.
2. In the sticky top header, click the **Archive Product** button (with the archive icon).
3. The system executes a secure multi-step transaction:
   - Sets `isArchived: true` and `isActive: false` on the parent product.
   - Cascades `isActive: false` across all associated product variants.
   - Creates an entry in the immutable `AuditLog` noting the actor, timestamp, and action (`PRODUCT_ARCHIVED`).
   - Publishes a real-time event notifying open POS terminals and web sessions to unload the item.
4. The product badge changes to **Archived (amber)**. The item is removed from `/inventory` and relocated to the **Archived Items Vault**.

---

## 4. Restoring an Archived Product

Archived items are never lost. You can restore them at any time:

### Steps to Restore

1. Navigate to **Inventory** in the sidebar.
2. If archived items exist, you can view the archive list by navigating to `/inventory/archived` (or via the Archive button in inventory settings).
3. Filter or search for the archived item.
4. Click on the product name to open `/inventory/products/[id]`.
5. Notice the **Unarchive Product** button (green outline) in the top header.
6. Click **Unarchive Product**.
7. The system resets `isArchived: false` and `isActive: true`, reactivates the variants, logs the restoration in the audit history, and moves the item back into active inventory.

---

## 5. Permanently Deleting a Product

### When Deletion is Allowed

Permanent deletion physically removes records from the database. It should only be used for:
- Test products created during onboarding.
- Items entered by mistake with zero sales history.

### Deletion Protection

1. Click **Delete / Disable** in the top header.
2. Click **Permanently Delete**.
3. Confirm the action in the alert dialog.
4. **Foreign Key Protection Rule**: If the item has ever been used in:
   - A completed transaction (`TransactionItem`)
   - An active purchase order (`PurchaseItem`)
   - A recipe ingredient (`RecipeIngredient`)

   The database rejects the deletion with a constraint error. **In these cases, you must Archive the product instead of deleting it.**

---

## 6. Audit History & State Reversion (Activity Tab)

For store owners and administrators, Scryme provides point-in-time state recovery:

1. Open `/inventory/products/[id]`.
2. Select the **Activity** tab (available to Owner and Admin roles).
3. A timeline of all historical modifications (Creation, Edits, Archive, and Restores) is displayed, showing:
   - The user who made the change.
   - The date and time.
   - Detailed JSON snapshot before and after the modification.
4. If an operator accidentally overwrote prices, SKUs, or descriptions, click **Revert State** next to any previous snapshot.
5. The system automatically restores the product attributes, variants, and pricing to the exact values recorded in that snapshot.
