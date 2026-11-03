# Creating Products

This guide walks operators through creating a new product from the Scryme web dashboard.

## 1. Accessing the Product Creation Sheet

1. Navigate to **Inventory** (`/inventory`) in the main sidebar.
2. In the top-right toolbar, click the **Add Item** button.
3. The **New Product Sheet** slides open from the right side of the screen.

---

## 2. Step 1: Basic Information

The first section establishes identity and taxonomy:

### Fields & Rules

- **Product Name** *(Required)*:
  - Enter the full title of the item (e.g., `Artisan Sourdough Bread`).
  - As you type, the system automatically derives initial values for **SKU** and **URL Slug**.
- **SKU (Stock Keeping Unit)** *(Required)*:
  - Defaults to a 3-letter prefix based on the name plus a 5-digit random integer (e.g., `ART-48291`).
  - You can override this manually by typing in the field.
  - The system performs a live, debounced uniqueness check against your organization's catalog.
    - Green checkmark: SKU is valid and available.
    - Red outline with alert: SKU already exists in this tenant. You must choose a unique SKU.
- **URL Slug**:
  - Automatically generated using strict lowercase kebab-case (e.g., `artisan-sourdough-bread`).
  - Used for storefront URL routing and catalog references.
  - Also validated in real time for tenant uniqueness.
- **Category** *(Required)*:
  - Select the parent classification for the product.
  - If the required category does not exist yet, click **Create Inline** above the dropdown to open the category dialog without leaving your workflow.
- **Item Type** *(Required)*:
  - `Finished Good`: Products manufactured or prepared for direct retail sale.
  - `Raw Material`: Ingredients or components used in recipes and production runs (retail price is disabled for raw materials).
  - `Merchandise`: Pre-packaged items purchased and resold without transformation.
  - `Other`: General miscellaneous products.

---

## 3. Step 2: Pricing & Stock

The second section defines cost, retail value, and initial on-hand stock:

### Pricing & Margin Indicators

- **Cost Price (Buying Price)** *(Required)*:
  - Enter your organization's purchase or acquisition cost per base piece.
- **Retail Price** *(Required for Finished Goods and Merchandise)*:
  - Enter the standard selling price charged to customers.
  - **Live Gross Margin Badge**:
    - As soon as both Cost Price and Retail Price are entered, Scryme calculates:
      $$\text{Gross Margin \%} = \frac{\text{Retail Price} - \text{Cost Price}}{\text{Retail Price}} \times 100$$
    - **Green Badge (Healthy)**: Margin is $\ge 20\%$.
    - **Amber Badge (Low Margin)**: Margin is between $0\%$ and $20\%$.
    - **Red Badge (Below Cost)**: Selling price is less than buying price.
- **Restock Unit (Optional)**:
  - Defaults to the system base unit (`Piece` / `pc`).
  - If you purchase this item in bulk (e.g., `Carton` or `Kilogram`), select the appropriate System or Organization unit here.
- **Default Variant Stock**:
  - Enter the physical quantity currently on hand at your store's default inventory location.
  - Setting a number greater than `0` triggers automatic backend inventory provisioning:
    1. A **Default Variant** (`ProductVariant`) is created.
    2. A **Stock Record** (`ProductVariantStock`) is initialized at your default store location.
    3. A **Stock Batch** (`StockBatch`) is created with an enterprise batch number (e.g., `INIT-ART-48291-1024`).
    4. An approved **Stock Adjustment** and **Stock Movement** are recorded in the ledger for complete traceability.

---

## 4. Step 3: Product Images

- Upload up to 3 high-resolution images.
- Drag and drop image files or paste image URLs.
- The first image is automatically designated as the primary display image in point-of-sale terminals and web catalogs.

---

## 5. Saving the Product

1. Ensure no uniqueness conflict warnings appear on SKU or URL Slug.
2. Click **Create Product** at the bottom of the sheet.
3. Upon success, you are redirected or the item immediately appears at the top of your **Inventory Table**.
4. Click on the product name in the table to open its detailed management view (`/inventory/products/[id]`) to configure additional variants, selling units, or reorder rules.
