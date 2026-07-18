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
      const transformCallback = (cb) => {
          const id = Math.floor(Math.random() * 1000000);
          (window as any)[`_tauri_cb_${id}`] = cb;
          return id;
      };

      const mockInvoke = async (cmd, args) => {
        console.log('Mocked invoke called:', cmd, JSON.stringify(args));

        if (cmd === 'get_device_config' || cmd.includes('get_device_config')) return {
            location_id: 'cljr7yv7c000108m73ge56fjr',
            allow_negative_stock: false,
            base_url: 'http://localhost:3000',
            device_key: 'test-key'
        };

        if (cmd === 'get_locations_command') return { locations: [{
            id: 'cljr7yv7c000108m73ge56fjr',
            name: 'Test Store',
            locationType: 'RETAIL_SHOP',
            isActive: true,
            isDefault: true,
            organizationId: 'test-org'
          }] };

        if (cmd === 'search_products_command') {
            return {
                products: [
                  {
                    productId: 'p1',
                    name: 'Test Product',
                    category: 'Test Category',
                    variants: [{
                        variantId: 'cljr7yv7c000208m73ge56fjr',
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
                total_count: 1,
                page: 1,
                page_size: 50
            };
        }

        if (cmd === 'search_customers_command') {
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

        if (cmd === 'get_ably_auth_token_command') return {
            data: {
                tokenRequest: {
                    token: 'mock-jwt-token'
                },
                metadata: {
                    paymentChannel: 'mock-payment-channel'
                }
            }
        };

        if (cmd === 'get_pos_pricing_command') return [];
        if (cmd === 'resolve_price_batch_command') return {};

        if (cmd === 'create_order_command') {
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

        if (cmd === 'get_invoice_blob_command') {
            // Return a dummy PDF blob (array of bytes)
            return Array.from(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52])); // "%PDF-1.4"
        }

        // Handle other common commands to prevent errors
        if (cmd === 'get_app_version' || cmd.includes('app|version')) return '3.3.0';
        if (cmd === 'get_network_status_command') return true;
        if (cmd === 'get_unread_notification_count') return 0;
        if (cmd === 'get_notification_history') return [];
        if (cmd === 'get_hub_status' || cmd.includes('get_hub_status')) return { is_running: false };
        if (cmd === 'get_tables_command') return [];
        if (cmd === 'get_local_ip_command') return '127.0.0.1';
        if (cmd === 'get_system_printers') return [];
        if (cmd === 'discover_network_printers') return [];
        if (cmd.includes('event|listen')) return 123;
        if (cmd.includes('updater|check')) return null;

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

      localStorage.setItem('pos-auth-storage-v2', JSON.stringify(authState));
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
    await page.click('span:has-text("John Doe")');
    await expect(page.locator('text=SELECTED CUSTOMER')).toBeVisible();

    // 2. Add Item
    await page.click('button:has-text("Select product...")');
    await page.fill('input[placeholder*="Search by name"]', 'Test Product');
    await page.click('span:has-text("Test Product")');

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
