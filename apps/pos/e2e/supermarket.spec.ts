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

        // Handle plugin calls
        if (cmd.startsWith('plugin:')) {
            if (cmd.includes('get_device_config')) return { location_id: 'test-loc', allow_negative_stock: false };
            if (cmd.includes('app|version')) return '3.3.0';
            if (cmd.includes('store|load')) return 1;
            if (cmd.includes('store|get')) return null;
            if (cmd.includes('updater|check')) return null;
            if (cmd.includes('event|listen')) return 123;
            if (cmd.includes('log|log')) return null;
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

        if (cmd === 'get_device_config') return { location_id: 'test-loc', allow_negative_stock: false };
        if (cmd === 'get_locations_command') return { locations: [{
            id: 'test-loc',
            name: 'Test Store',
            locationType: 'RETAIL_SHOP',
            isActive: true,
            isDefault: true,
            organizationId: 'test-org'
          }] };
        if (cmd === 'resolve_price_batch_command') return [100];
        if (cmd === 'get_tables_command') return [];
        if (cmd === 'get_local_ip_command') return '127.0.0.1';
        if (cmd === 'start_nfc_listener') return null;
        if (cmd === 'get_system_printers') return [];
        if (cmd === 'discover_network_printers') return [];
        if (cmd === 'get_printer_config') return null;
        if (cmd === 'get_unread_notification_count') return 0;
        if (cmd === 'get_notification_history') return [];
        if (cmd === 'get_app_version') return '3.3.0';
        if (cmd === 'check_kds_hub_status') return false;
        if (cmd === 'get_hub_status') return { is_running: false };
        if (cmd === 'search_products_command') {
            return {
                products: [
                  {
                    productId: 'p1',
                    productName: 'Milk',
                    category: 'Dairy',
                    variants: [{ variantId: 'v1', variantName: 'Whole Milk', barcode: '123' }],
                    sellableUnits: [{ unitId: 'u1', unitName: '1L', price: 100, isBaseUnit: true }],
                    stock: 50
                  }
                ].filter(p =>
                    !args.query || p.productName.toLowerCase().includes(args.query.toLowerCase())
                ),
                total_count: 1,
                page: 1,
                page_size: 50
            };
        }
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
      localStorage.setItem('dealio-pos-storage-v1', JSON.stringify(posState));

      // Inject some CSS to hide potential blocking overlays that aren't critical for the test
      const style = document.createElement('style');
      style.innerHTML = `
        .sonner-toaster, [data-sonner-toaster] { display: none !important; }
        #connection-status-banner { display: none !important; }
        .ud-root { display: none !important; }
      `;
      document.head.appendChild(style);
      localStorage.setItem('DEVICE_ID', 'test-device');
      localStorage.setItem('DEVICE_ROLE', 'MAIN_HUB');
    }, { now: currentTimestamp });

    // Navigate to the app
    await page.goto('/');

    // Wait for splash screen to disappear and app to load
    // Check for splash root and wait for it to be removed or hidden
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
    // In POS.tsx it's an icon or text inside a button
    const holdButton = page.getByRole('button', { name: /Hold/i });
    await expect(holdButton).toBeVisible();
    await holdButton.click();

    // Verify cart is cleared. Cart header usually shows item count.
    // In AppLayout it might be different, but let's check for 0 items text
    await expect(page.getByText(/0 Items/i).or(page.getByText(/empty/i))).toBeVisible();
  });
});
