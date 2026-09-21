import { test, expect } from '@playwright/test';

// Mock CUIDs
const MOCK_CUSTOMER_ID = 'cljr7yv7c000008m73ge56fjr';
const MOCK_LOCATION_ID = 'cljr7yv7c000108m73ge56fjr';
const MOCK_VARIANT_ID = 'cljr7yv7c000208m73ge56fjr';
const MOCK_UNIT_ID = 'cljr7yv7c000308m73ge56fjr';

test.describe('Order Creation and Invoice Download Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Forward console logs from the page
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('PAGE ERROR:', msg.text());
        } else {
            console.log('PAGE LOG:', msg.text());
        }
    });

    const currentTimestamp = Date.now();

    // 1. Mock Tauri APIs and Inject state
    await page.addInitScript(() => {
      (window as any).process = (window as any).process || { env: {} };
      const transformCallback = (cb) => {
          const id = Math.floor(Math.random() * 1000000);
          (window as any)[`_tauri_cb_${id}`] = cb;
          return id;
      };

      const mockInvoke = async (cmd, args) => {
        console.log('Mocked invoke called:', cmd, JSON.stringify(args));

        if (cmd.includes('authenticated_api_request')) {
          if (args?.path?.includes('pos/me') || args?.path?.includes('me')) {
            return { success: true, isCheckedIn: true, memberId: 'test-mem', data: { isCheckedIn: true, memberId: 'test-mem' } };
          }
          return { success: true, data: {} };
        }

        if (cmd.includes('get_device_config')) {
          return {
            location_id: 'cljr7yv7c000108m73ge56fjr',
            org_slug: 'test-org',
            allow_negative_stock: false,
            base_url: 'http://localhost:3000',
            device_key: 'test-key'
          };
        }

        if (cmd.includes('get_locations')) {
          return {
            locations: [{
              id: 'cljr7yv7c000108m73ge56fjr',
              name: 'Test Store',
              locationType: 'RETAIL_SHOP',
              isActive: true,
              isDefault: true,
              organizationId: 'test-org'
            }]
          };
        }

        if (cmd.includes('search_products')) {
          return {
            products: [
              {
                productId: 'p1',
                productName: 'Test Product',
                name: 'Test Product',
                category: 'Test Category',
                variants: [{
                  variantId: 'cljr7yv7c000208m73ge56fjr',
                  variantName: 'Standard Variant',
                  name: 'Standard Variant',
                  sku: 'SKU-1',
                  barcode: '123',
                  stock: 100,
                  sellableUnits: [
                    { unitId: 'cljr7yv7c000308m73ge56fjr', unitName: 'Piece', price: 500, isBaseUnit: true, conversion: 1 }
                  ]
                }],
              }
            ],
            totalCount: 1,
            total_count: 1,
            page: 1,
            page_size: 50
          };
        }

        if (cmd.includes('search_customers')) {
          return [
            {
              id: 'cljr7yv7c000008m73ge56fjr',
              name: 'John Doe',
              email: 'john@example.com',
              phone: '0712345678',
              loyaltyPoints: 10,
              customerType: 'retail',
              addresses: [
                { id: 'a1', label: 'Home', street: '123 Main St', city: 'Nairobi', isDefault: true }
              ]
            }
          ];
        }

        if (cmd.includes('create_order')) {
          return {
            success: true,
            data: {
              data: {
                number: 'ORD-12345',
                orderId: 'order-uuid-1',
                invoiceUrl: 'http://localhost:3000/invoices/inv-123.pdf'
              }
            }
          };
        }

        if (cmd.includes('get_invoice_blob')) {
          return Array.from(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]));
        }

        if (cmd.includes('get_ably_auth_token')) return { data: { tokenRequest: { token: 'mock-jwt-token' }, metadata: { paymentChannel: 'mock-payment-channel' } } };
        if (cmd.includes('get_pos_pricing')) return [];
        if (cmd.includes('resolve_price_batch')) return {};
        if (cmd.includes('get_app_version') || cmd.includes('app|version')) return '3.3.0';
        if (cmd.includes('get_network_status')) return true;
        if (cmd.includes('get_unread_notification_count')) return 0;
        if (cmd.includes('get_notification_history')) return [];
        if (cmd.includes('get_shift')) return { id: 'test-shift', status: 'open' };
        if (cmd.includes('plugin:os') || cmd.includes('os|')) return 'linux';
        if (cmd.includes('plugin:log') || cmd.includes('log|')) return null;
        if (cmd.includes('get_hub_status')) return { is_running: false };
        if (cmd.includes('get_tables')) return [];
        if (cmd.includes('get_local_ip')) return '127.0.0.1';
        if (cmd.includes('get_system_printers')) return [];
        if (cmd.includes('discover_network_printers')) return [];
        if (cmd.includes('update_base_url')) return null;
        if (cmd.includes('restore_member_session')) return null;

        return null;
      };

      (window as any).__TAURI_INTERNALS__ = {
        invoke: mockInvoke,
        metadata: { windowLabel: 'main' },
        transformCallback: transformCallback,
        plugins: {
            event: {
                unregisterListener: () => Promise.resolve()
            }
        }
      };

      const mockWindow = {
        label: 'main',
        listen: () => Promise.resolve(() => {}),
        onCloseRequested: () => Promise.resolve(() => {}),
        onFocusChanged: () => Promise.resolve(() => {}),
        show: () => Promise.resolve(),
        hide: () => Promise.resolve(),
        close: () => Promise.resolve(),
        setFocus: () => Promise.resolve(),
      };

      (window as any).__TAURI__ = {
        core: { invoke: mockInvoke, transformCallback: transformCallback },
        event: { listen: () => Promise.resolve(() => {}), emit: () => Promise.resolve() },
        window: {
            getCurrentWindow: () => mockWindow,
            getCurrent: () => mockWindow,
            getAll: () => [mockWindow],
        }
      };

      // Mock Ably
      (window as any).Ably = {
          Realtime: function() {
              this.connection = {
                  on: () => {},
                  state: 'connected'
              };
              this.channels = {
                  get: () => ({
                      subscribe: () => {},
                      unsubscribe: () => {},
                      presence: {
                          enter: () => Promise.resolve()
                      },
                      history: () => Promise.resolve({ items: [] })
                  })
              };
              this.close = () => {};
          }
      };
      localStorage.setItem('ably-disabled', 'true');
    });

    // 2. Inject state
    await page.addInitScript(({ now, locId }) => {
      const authState = {
        state: {
          isConfigured: true,
          currentLocation: { id: locId, name: 'Test Store' },
          currentMember: { id: 'test-mem', name: 'Test User', role: 'admin' },
          isInitialized: true,
          deviceType: 'MAIN_HUB',
        },
        version: 0
      };

      const posState = {
        state: {
          settings: {
            businessType: 'retail',
            businessName: 'Test Store',
            taxRate: 5,
            currency: 'KSH',
            sidebarItems: [],
            themeConfig: {
              mode: 'light',
              primaryColor: 'oklch(0.42 0.145 265)',
              accentColor: 'oklch(0.96 0.005 240)',
              fontSize: 'medium',
              compactMode: false,
              zoomLevel: 100
            },
            notificationSettings: {
              enabled: true,
              soundEnabled: false,
              showOnlineOrders: true,
              showLowStock: true,
              showSystemAlerts: true,
              position: 'top-right',
              autoCloseDelay: 5000
            }
          },
        },
        version: 0
      };

      localStorage.setItem('pos-auth-storage-v3', JSON.stringify(authState));
      localStorage.setItem('scryme-pos-storage-v1', JSON.stringify(posState));
      localStorage.setItem('DEVICE_ID', 'test-device');
      localStorage.setItem('DEVICE_ROLE', 'MAIN_HUB');
    }, { now: currentTimestamp, locId: MOCK_LOCATION_ID });

    await page.goto('/create-order');
    await page.waitForSelector('h1:has-text("New Order")', { timeout: 15000 });
  });

  test('should create an order and allow downloading the invoice', async ({ page }) => {
    // 1. Select Customer
    await page.click('button:has-text("Select customer...")');
    await page.fill('input[placeholder*="Search by name"]', 'John Doe');
    await page.click('span:has-text("John Doe")', { force: true });
    await expect(page.locator('text=SELECTED CUSTOMER')).toBeVisible();

    // 2. Add Item
    await page.click('button:has-text("Select product...")');
    await page.fill('input[placeholder*="Search by name"]', 'Test Product');
    await page.click('span:has-text("Test Product")', { force: true });

    // Verify item added
    await expect(page.locator('td:has-text("Test Product")')).toBeVisible();

    // 3. Submit Order
    await page.click('button:has-text("Create Invoice")');

    // 4. Verify Success Screen
    await expect(page.locator('h2:has-text("Order Confirmed!")')).toBeVisible();
    await expect(page.locator('text=Reference: ORD-12345')).toBeVisible();

    // 5. Verify Invoice Download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Save Invoice")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('Invoice_ORD_12345');
    console.log('Download successful:', download.suggestedFilename());
  });
});
