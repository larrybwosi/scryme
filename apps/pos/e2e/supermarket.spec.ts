import { test, expect } from '@playwright/test';

test.describe('Supermarket POS Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Forward console logs from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

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

        if (cmd.includes('authenticated_api_request')) {
          if (args?.path?.includes('pos/me') || args?.path?.includes('me')) {
            return { success: true, isCheckedIn: true, memberId: 'test-mem', data: { isCheckedIn: true, memberId: 'test-mem' } };
          }
          return { success: true, data: {} };
        }

        if (cmd.includes('get_device_config')) {
          return { location_id: 'test-loc', org_slug: 'test-org', allow_negative_stock: false };
        }

        if (cmd.includes('get_locations')) {
          return {
            locations: [{
              id: 'test-loc',
              name: 'Test Store',
              locationType: 'RETAIL_SHOP',
              isActive: true,
              isDefault: true,
              organizationId: 'test-org'
            }]
          };
        }

        if (cmd.includes('search_products')) {
          const query = args?.query || args?.search || '';
          return {
            products: [
              {
                productId: 'p1',
                productName: 'Milk',
                name: 'Milk',
                category: 'Dairy',
                variantId: 'v1',
                variantName: 'Whole Milk',
                stock: 50,
                variants: [{ variantId: 'v1', variantName: 'Whole Milk', name: 'Whole Milk', barcode: '123', stock: 50 }],
                sellableUnits: [{ unitId: 'u1', unitName: '1L', price: 100, isBaseUnit: true }]
              }
            ].filter(p => !query || p.productName.toLowerCase().includes(query.toLowerCase())),
            totalCount: 1,
            total_count: 1,
            page: 1,
            page_size: 50
          };
        }

        if (cmd.includes('get_product_by_barcode')) {
          return {
            productId: 'p1',
            productName: 'Milk',
            name: 'Milk',
            category: 'Dairy',
            variants: [{ variantId: 'v1', variantName: 'Whole Milk', name: 'Whole Milk', barcode: '123', stock: 50 }],
            sellableUnits: [{ unitId: 'u1', unitName: '1L', price: 100, isBaseUnit: true }]
          };
        }

        if (cmd.includes('get_ably_auth_token')) return { data: { tokenRequest: { token: 'mock-jwt-token' }, metadata: { paymentChannel: 'mock-payment-channel' } } };
        if (cmd.includes('resolve_price_batch')) return [100];
        if (cmd.includes('get_tables')) return [];
        if (cmd.includes('get_local_ip')) return '127.0.0.1';
        if (cmd.includes('get_system_printers')) return [];
        if (cmd.includes('discover_network_printers')) return [];
        if (cmd.includes('get_printer_config')) return null;
        if (cmd.includes('get_unread_notification_count')) return 0;
        if (cmd.includes('get_notification_history')) return [];
        if (cmd.includes('app_version') || cmd.includes('app|version')) return '3.3.0';
        if (cmd.includes('check_kds_hub_status')) return false;
        if (cmd.includes('get_hub_status')) return { is_running: false };
        if (cmd.includes('update_base_url')) return null;
        if (cmd.includes('restore_member_session')) return null;
        if (cmd.includes('store|load') || cmd.includes('store|get')) return null;
        if (cmd.includes('event|listen') || cmd.includes('updater|check') || cmd.includes('log|log')) return null;

        return null;
      };

      // Tauri v2 internals
      (window as any).__TAURI_INTERNALS__ = {
        invoke: mockInvoke,
        metadata: {
            windowLabel: 'main'
        },
        transformCallback: transformCallback,
        plugins: {
            store: {
                load: () => Promise.resolve(1),
                get: () => Promise.resolve(null)
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

      const mockTauri = {
        core: {
          invoke: mockInvoke,
          transformCallback: transformCallback
        },
        event: {
          listen: () => Promise.resolve(() => {}),
          emit: () => Promise.resolve()
        },
        window: {
            getCurrentWindow: () => mockWindow,
            getCurrent: () => mockWindow,
            getAll: () => [mockWindow],
            WebviewWindow: function() { return mockWindow; }
        }
      };

      (window as any).__TAURI__ = mockTauri;

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
    await page.addInitScript(({ now }) => {
      const authState = {
        state: {
          isConfigured: true,
          currentLocation: {
            id: 'test-loc',
            name: 'Test Store',
            locationType: 'RETAIL_SHOP',
            isActive: true,
            isDefault: true,
            organizationId: 'test-org'
          },
          currentMember: {
            id: 'test-mem',
            name: 'Test User',
            organizationId: 'test-org',
            userId: 'test-user',
            isActive: true,
            isCheckedIn: true,
            image: '',
            role: 'admin',
            email: 'test@example.com'
          },
          isRestoredSession: true,
          sessionUpdatedAt: now,
          isInitialized: true,
          deviceType: 'MAIN_HUB',
          allowNegativeStock: false,
          hubIp: null
        },
        version: 0
      };

      const posState = {
        state: {
          currentOrder: {
            customerName: '',
            orderType: 'takeaway',
            items: [],
            tableNumber: '',
            instructions: '',
            metadata: {},
            customerId: '',
            customerPhone: '',
            loyaltyPoints: 0,
          },
          orders: [],
          products: [],
          settings: {
            businessType: 'supermarket',
            businessName: 'Test Store',
            enableHoldSale: true,
            sidebarItems: [],
            taxRate: 5,
            currency: 'KSH',
            autoPrintConfig: {
                openCashDrawer: false,
                printReceipt: false
            },
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
            },
            customerDisplayConfig: {
                enabled: false,
                welcomeMessage: '',
                subMessage: '',
                showTime: false,
                promoSlides: [],
                slideIntervalSeconds: 8,
                showCompanyLogo: false
            },
            kitchenTicketConfig: {
                showTime: true,
                showOrderType: true,
                showCustomerName: true,
                showTable: true,
                showPrices: false,
                showNotes: true,
                fontSize: 'medium',
                paperSize: '80mm',
                autoPrintCompleted: false,
                enableStationRouting: false,
                stations: [],
                defaultStation: 'Expo',
                printToAllStations: false,
                showPriority: true,
                highlightRushOrders: true,
                rushOrderColor: '#ef4444',
                rushOrderThresholdMinutes: 15,
                showAllergens: true,
                showDietaryIcons: true,
                allergenHighlightColor: '#f59e0b',
                dietaryLabels: [],
                printCopies: 1,
                printDelaySeconds: 0,
                autoPrintNewOrders: true,
                soundAlertOnNewOrder: true,
                showEstimatedPrepTime: false,
                showOrderAge: true,
                showSequenceNumber: true,
                autoPrintKds: false,
                compactMode: false,
                showCategoryHeaders: true,
                showModifiersSeparately: true,
                largeQuantityDisplay: true,
                showItemSeparators: true,
                headerText: '',
                footerText: '',
                showServerName: true
            },
            enableAutoStart: false,
            enableKdsSystem: false,
            maxHeldOrders: 20,
            requireHoldReason: false,
            enableBarcodeScanner: true
          },
          heldOrders: [],
          tables: [],
          employees: [],
          notifications: [],
          unreadNotificationCount: 0,
          cashDrawers: [],
          currentEmployeeId: null,
          activeCashDrawerId: null
        },
        version: 0
      };

      localStorage.setItem('pos-auth-storage-v3', JSON.stringify(authState));
      localStorage.setItem('scryme-pos-storage-v1', JSON.stringify(posState));

      const appendStyle = () => {
        const style = document.createElement('style');
        style.innerHTML = `
          #splash-root { display: none !important; opacity: 0 !important; }
          .sonner-toaster, [data-sonner-toaster] { display: none !important; }
          #connection-status-banner { display: none !important; }
          .ud-root { display: none !important; }
        `;
        if (document.head) {
          if (document.head) { document.head.appendChild(style); } else if (document.documentElement) { document.documentElement.appendChild(style); } else { document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style)); }
        } else if (document.documentElement) {
          document.documentElement.appendChild(style);
        }
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendStyle);
      } else {
        appendStyle();
      }
      localStorage.setItem('DEVICE_ID', 'test-device');
      localStorage.setItem('DEVICE_ROLE', 'MAIN_HUB');
    }, { now: currentTimestamp });

    // Navigate to the app
    await page.goto('/');

    // Wait for splash screen to disappear and app to load
    await page.waitForFunction(() => {
        const splash = document.getElementById('splash-root');
        return !splash || splash.style.opacity === '0' || getComputedStyle(splash).opacity === '0';
    }, { timeout: 15000 });

    // The placeholder should be a good indicator. SupermarketPOS uses "Search products manually..."
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 15000 });
  });

  test('should allow searching and adding a product to cart', async ({ page }) => {
    // Inject a mock product into the store if needed, but for now we'll assume the search works
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill('Milk');

    // Wait for search results
    const productItem = page.getByText('Milk').first();
    await expect(productItem).toBeVisible();

    // Click to add to cart
    await productItem.click();

    // Check if added to cart
    await expect(page.getByText('1 Items')).toBeVisible();
  });

  test('should allow holding a sale', async ({ page }) => {
    // Add an item first
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('Milk');

    const productItem = page.getByText('Milk').first();
    await expect(productItem).toBeVisible();
    await productItem.click();

    // Click Hold (the text might vary depending on the view, so use a more robust locator)
    const holdButton = page.getByRole('button', { name: /Hold/i });
    await expect(holdButton).toBeVisible();
    await holdButton.click();

    // Verify cart is cleared
    await expect(page.getByText(/0 Items/i).or(page.getByText(/empty/i))).toBeVisible();
  });
});
