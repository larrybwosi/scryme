# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-verification.spec.ts >> verify receipt customization settings
- Location: e2e/test-verification.spec.ts:3:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Add Custom Section")')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - link "TE Test Biz Test Location" [ref=e6] [cursor=pointer]:
          - /url: /
          - generic [ref=e8]: TE
          - generic [ref=e9]:
            - generic [ref=e10]: Test Biz
            - generic [ref=e11]:
              - img [ref=e12]
              - generic [ref=e15]: Test Location
        - button [ref=e16]:
          - img [ref=e17]
      - navigation [ref=e20]:
        - link "Receipts" [ref=e21] [cursor=pointer]:
          - /url: /receipt-settings
          - img
          - generic [ref=e22]: Receipts
        - generic [ref=e23]:
          - button "Validate Order" [ref=e24]:
            - img
            - generic [ref=e25]: Validate Order
          - link "Pending" [ref=e26] [cursor=pointer]:
            - /url: /pending-transactions
            - img
            - generic [ref=e27]: Pending
          - link "Create Order" [ref=e28] [cursor=pointer]:
            - /url: /create-order
            - img
            - generic [ref=e29]: Create Order
          - link "Cash Drawer" [ref=e30] [cursor=pointer]:
            - /url: /cash-drawer
            - img
            - generic [ref=e31]: Cash Drawer
      - generic [ref=e32]:
        - button "Shortcuts Help" [ref=e33]:
          - img
          - generic [ref=e34]: Shortcuts Help
        - link "Receipt Settings" [ref=e35] [cursor=pointer]:
          - /url: /receipt-settings
          - img
          - generic [ref=e36]: Receipt Settings
        - link "Settings" [ref=e37] [cursor=pointer]:
          - /url: /settings
          - img
          - generic [ref=e38]: Settings
        - generic [ref=e40]:
          - generic [ref=e42]: AD
          - generic [ref=e44]: Admin
          - button [ref=e45]:
            - img
    - generic [ref=e46]:
      - banner [ref=e47]:
        - generic [ref=e49]:
          - generic [ref=e50] [cursor=pointer]:
            - img [ref=e51]
            - generic [ref=e54]: Search...
            - generic:
              - generic: ⌘
              - text: K
          - generic [ref=e55]:
            - heading "Command Palette" [level=2] [ref=e56]
            - paragraph [ref=e57]: Search for a command to run...
        - generic [ref=e58]:
          - button [ref=e59]:
            - img
          - button [ref=e60]:
            - img
          - button "09 Jun 2026" [ref=e61]:
            - img
            - text: 09 Jun 2026
      - generic [ref=e63]:
        - generic [ref=e64]:
          - generic [ref=e65]:
            - generic [ref=e66]:
              - img [ref=e68]
              - generic [ref=e71]:
                - heading "Print Configuration" [level=2] [ref=e72]
                - paragraph [ref=e73]: customer receipt
            - button "Reset" [ref=e74]:
              - img
              - text: Reset
          - button "Customer Receipt" [ref=e77]:
            - img [ref=e78]
            - text: Customer Receipt
            - img [ref=e81]
          - generic [ref=e84]:
            - generic [ref=e86]:
              - button "Branding" [ref=e87]:
                - img [ref=e88]
                - text: Branding
              - button "Content" [ref=e94]:
                - img [ref=e95]
                - text: Content
              - button "Custom Sections" [ref=e98]:
                - img [ref=e99]
                - text: Custom Sections
              - button "Legal" [ref=e100]:
                - img [ref=e101]
                - text: Legal
              - button "Print" [ref=e104]:
                - img [ref=e105]
                - text: Print
              - button "Extras" [ref=e109]:
                - img [ref=e110]
                - text: Extras
            - generic [ref=e114]:
              - generic [ref=e115]:
                - generic [ref=e116]:
                  - img [ref=e118]
                  - generic [ref=e124]:
                    - paragraph [ref=e125]: Logo & Brand Identity
                    - paragraph [ref=e126]: Visual branding on printed receipts
                - generic [ref=e127]:
                  - generic [ref=e128]:
                    - paragraph [ref=e130]: Show Logo
                    - switch [checked] [ref=e132]
                  - generic [ref=e133]:
                    - generic [ref=e134]:
                      - generic [ref=e135]: Logo URL
                      - textbox "https://..." [ref=e136]
                    - generic [ref=e137]:
                      - generic [ref=e138]:
                        - generic [ref=e139]: Position
                        - combobox [ref=e140]:
                          - generic: Center
                          - img
                      - generic [ref=e141]:
                        - generic [ref=e142]: Size — 50%
                        - slider [ref=e144]
                  - generic [ref=e145]:
                    - paragraph [ref=e147]: Show Tagline
                    - switch [ref=e149]
              - generic [ref=e150]:
                - generic [ref=e151]:
                  - img [ref=e153]
                  - generic [ref=e155]:
                    - paragraph [ref=e156]: Layout & Typography
                    - paragraph [ref=e157]: Paper size and font preferences
                - generic [ref=e158]:
                  - generic [ref=e159]:
                    - generic [ref=e160]:
                      - generic [ref=e161]: Paper Size
                      - combobox [ref=e162]:
                        - generic: 80mm (Standard)
                        - img
                    - generic [ref=e163]:
                      - generic [ref=e164]: Font Style
                      - combobox [ref=e165]:
                        - generic: Monospace
                        - img
                    - generic [ref=e166]:
                      - generic [ref=e167]: Font Size
                      - combobox [ref=e168]:
                        - generic: Medium
                        - img
                    - generic [ref=e169]:
                      - generic [ref=e170]: Alignment
                      - combobox [ref=e171]:
                        - generic: Center
                        - img
                  - generic [ref=e172]:
                    - generic [ref=e173]: Item Spacing — 2px
                    - slider [ref=e175]
              - generic [ref=e176]:
                - generic [ref=e177]:
                  - img [ref=e179]
                  - generic [ref=e183]:
                    - paragraph [ref=e184]: Business Contact
                    - paragraph [ref=e185]: Contact information printed on receipt
                - generic [ref=e186]:
                  - generic [ref=e187]:
                    - paragraph [ref=e189]: Address
                    - switch [checked] [ref=e191]
                  - textbox [ref=e192]: 123 Main Street, City, Country
                  - generic [ref=e193]:
                    - paragraph [ref=e195]: Phone
                    - switch [checked] [ref=e197]
                  - textbox [ref=e198]: +1 234 567 8900
                  - generic [ref=e199]:
                    - paragraph [ref=e201]: Email
                    - switch [checked] [ref=e203]
                  - textbox [ref=e204]: contact@business.com
                  - generic [ref=e205]:
                    - paragraph [ref=e207]: Website
                    - switch [checked] [ref=e209]
                  - textbox [ref=e210]: www.business.com
        - generic [ref=e211]:
          - button [ref=e213]:
            - img [ref=e214]
          - generic [ref=e216]:
            - button "Test Print" [ref=e217]:
              - img
              - text: Test Print
            - button "Export PDF" [ref=e218]:
              - img
              - text: Export PDF
          - generic [ref=e222]: Live Preview
  - generic [ref=e231]:
    - generic [ref=e234]:
      - img [ref=e237]
      - generic [ref=e240]:
        - heading "Update Available" [level=2] [ref=e242]
        - paragraph [ref=e243]: A new version is ready with improvements and bug fixes. Review the changes below.
      - button "Remind me later" [ref=e244]:
        - img [ref=e245]
    - generic [ref=e249]:
      - generic [ref=e250]:
        - img [ref=e251]
        - generic [ref=e254]: Release Notes
      - generic [ref=e257]:
        - img [ref=e258]
        - paragraph [ref=e260]: No release notes for this version.
    - generic [ref=e262]:
      - button "Skip this version" [ref=e264]:
        - img [ref=e265]
        - text: Skip this version
      - generic [ref=e270]:
        - button "Later" [ref=e271]
        - button "Download Update" [ref=e272]:
          - img [ref=e273]
          - text: Download Update
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('verify receipt customization settings', async ({ page }) => {
  4  |   test.setTimeout(60000);
  5  |
  6  |   // Comprehensive Tauri Mock
  7  |   await page.addInitScript(() => {
  8  |     (window as any).__TAURI_INTERNALS__ = {
  9  |       invoke: async (cmd: string, args: any) => {
  10 |         const handlers: Record<string, any> = {
  11 |           'get_device_config': { location_id: 'loc-123', org_slug: 'test-org', allow_negative_stock: false },
  12 |           'get_locations_command': { locations: [{ id: 'loc-123', name: 'Test Location', isActive: true, isDefault: true }] },
  13 |           'get_tables_command': [],
  14 |           'get_ably_auth_token_command': { data: { tokenRequest: { token: 'mock-token' }, metadata: { paymentChannel: 'test-channel', organizationId: 'test-org' } } },
  15 |           'plugin:app|version': '4.2.0',
  16 |           'plugin:updater|check': { available: false },
  17 |           'get_hub_status': { status: 'stopped' },
  18 |           'search_global_command': { products: [], customers: [], sales: [] },
  19 |           'plugin:store|load': { rid: 1 },
  20 |           'plugin:store|get': null,
  21 |           'plugin:event|listen': 0,
  22 |           'get_shift_status_command': { id: 'shift-123' }
  23 |         };
  24 |         if (cmd in handlers) return handlers[cmd];
  25 |         if (cmd.includes('get_')) return [];
  26 |         return null;
  27 |       },
  28 |       metadata: { currentWindowLabel: 'main' },
  29 |       transformCallback: (callback: any) => callback,
  30 |     };
  31 |     (window as any).__TAURI__ = {
  32 |       event: { listen: () => Promise.resolve(() => {}) },
  33 |       window: { getCurrentWindow: () => ({ onFocusChanged: () => {}, label: 'main' }) }
  34 |     };
  35 |   });
  36 |
  37 |   // Mock localStorage
  38 |   await page.addInitScript(() => {
  39 |     localStorage.setItem('realtime-disabled', 'true');
  40 |     localStorage.setItem('DEVICE_ROLE', 'MAIN_HUB');
  41 |     const authState = {
  42 |       state: {
  43 |         isConfigured: true, isInitialized: true,
  44 |         currentLocation: { id: 'loc-123', name: 'Test Location' },
  45 |         currentMember: { id: 'mem-123', name: 'Admin', cardId: 'card-123' },
  46 |         checkedInMembers: [{ id: 'mem-123', name: 'Admin' }],
  47 |         sessionUpdatedAt: Date.now(), deviceType: 'MAIN_HUB',
  48 |       }, version: 0
  49 |     };
  50 |     localStorage.setItem('pos-auth-storage-v3', JSON.stringify(authState));
  51 |     const posStore = {
  52 |       state: {
  53 |         settings: {
  54 |           businessName: 'Test Biz', businessType: 'retail', currency: 'USD',
  55 |           sidebarItems: [{ id: 'receipt-settings', label: 'Receipts', icon: 'Receipt', enabled: true }],
  56 |           themeConfig: { mode: 'dark', fontSize: 'medium', primaryColor: '#34A853' },
  57 |           receiptConfig: {
  58 |             showLogo: true, logoUrl: '', logoWidth: 50, logoPosition: 'center', headerText: 'Header', footerText: 'Footer',
  59 |             paperSize: '80mm', fontFamily: 'monospace', fontSize: 'medium', textAlignment: 'center',
  60 |             showThankYouMessage: true, thankYouMessage: 'Thanks!', customSections: [],
  61 |             showOrderNumber: true, showCustomerName: true, showCashier: true,
  62 |           },
  63 |           enableAutoShiftPrompt: false
  64 |         },
  65 |         orders: [], products: [], currentOrder: { items: [], metadata: {} }
  66 |       }, version: 0
  67 |     };
  68 |     localStorage.setItem('dealio-pos-storage-v1', JSON.stringify(posStore));
  69 |   });
  70 |
  71 |   await page.goto('http://localhost:3000/receipt-settings');
  72 |   await page.waitForSelector('text=Print Configuration', { timeout: 30000 });
  73 |
  74 |   // Navigate to Custom Tab
  75 |   const customPill = page.locator('button:has-text("Custom Sections")');
  76 |   await customPill.click({ force: true });
  77 |
  78 |   // Add Custom Section
  79 |   const addButton = page.locator('button:has-text("Add Custom Section")');
> 80 |   await addButton.click({ force: true });
     |                   ^ Error: locator.click: Test timeout of 60000ms exceeded.
  81 |
  82 |   // Enter Data
  83 |   await page.locator('input[placeholder="e.g., Special Offer"]').fill('Verified Section');
  84 |   await page.locator('textarea[placeholder="Enter section content here..."]').fill('Verification Content');
  85 |
  86 |   // Toggle Bold
  87 |   await page.locator('button[role="switch"]').last().click({ force: true });
  88 |
  89 |   await page.waitForTimeout(2000);
  90 |
  91 |   // Final Screenshot
  92 |   await page.screenshot({ path: 'apps/pos/verification-receipt-custom.png' });
  93 | });
  94 |
```