import { createWithEqualityFn as create } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import posthog from 'posthog-js';
import { invoke } from '@tauri-apps/api/core';
import { sendOrderToKitchen } from '@/lib/kds';
import { type BusinessType, getBusinessConfig, getDefaultSidebarItems } from '../lib/business-configs';
import { AutoPrintConfig, DEFAULT_AUTO_PRINT_CONFIG } from '../types/print-types';

export type OrderType = 'takeaway' | 'delivery' | 'dine-in' | 'pickup' | 'online';
export type OrderStatus = 'waiting' | 'ready' | 'canceled' | 'completed';

export type NotificationType = 'order' | 'stock' | 'system' | 'warning' | 'error' | 'success';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  soundEnabled?: boolean;
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  showOnlineOrders: boolean;
  showLowStock: boolean;
  showSystemAlerts: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoCloseDelay: number;
}

export interface SellableUnit {
  unitId: string;
  unitName: string;
  price: number;
  conversion: number;
  isBaseUnit: boolean;
}

export interface Product {
  productId: string;
  productName: string;
  name?: string;
  variantId: string;
  variantName: string;
  category: string;
  sku: string;
  barcode?: string;
  imageUrl?: string;
  stock: number;
  sellableUnits: SellableUnit[];
  variants?: Variant[];
}

export interface Variant {
  variantId: string;
  name: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  selectedUnit: SellableUnit;
  quantity: number;
  isWholesale?: boolean;
  imageUrl?: string;
  sku?: string;
  price?: number;
  notes?: string;

  // Pharmacy specific
  requiresPrescription?: boolean;
  dosageInstructions?: string;
  pharmacistVerified?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  subTotal: number;
  discount: number;
  taxes: number;
  total: number;
  paymentMethod: string;
  tableNumber?: string;
  instructions?: string;
  metadata?: Record<string, any>;
  cashierName?: string;
  customerId?: string;
}

export type HeldOrderPriority = 'normal' | 'high' | 'urgent';

export interface HeldOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  loyaltyPoints?: number;
  orderType: OrderType;
  items: OrderItem[];
  tableNumber?: string;
  instructions?: string;
  metadata?: Record<string, any>;

  // Hold-specific metadata
  heldAt: Date;
  heldBy?: string; // Cashier/Employee ID
  heldByName?: string; // Cashier/Employee Name
  reason?: string; // Reason for holding
  priority: HeldOrderPriority;
  expiresAt?: Date; // Optional auto-expiry

  // Calculated totals at hold time
  subTotal: number;
  estimatedTax: number;
  estimatedTotal: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
}
export interface ReceiptConfig {
  // Branding
  showLogo: boolean;
  logoUrl: string;
  logoWidth: number; // Percentage
  logoPosition: 'left' | 'center' | 'right';

  // Business Details
  headerText: string;
  footerText: string;
  showAddress: boolean;
  address: string;
  showPhone: boolean;
  phone: string;
  showEmail: boolean;
  email: string;
  showTaxNumber: boolean;
  taxNumber: string;
  showWebsite: boolean;
  website: string;

  // Enterprise / Social
  showSocialMedia: boolean;
  socialMediaHandle: string;
  showReturnPolicy: boolean;
  returnPolicyText: string;

  // Layout & Typography
  paperSize: '80mm' | '58mm' | 'Letter';
  fontFamily: 'monospace' | 'sans' | 'serif';
  fontSize: 'small' | 'medium' | 'large';
  textAlignment: 'left' | 'center';
  marginHorizontal: number;
  itemSpacing: number;

  // Content Granularity
  dateFormat: string;
  showCashier: boolean;
  showCustomerName: boolean;
  showOrderType: boolean;
  showPaymentMethod: boolean;
  showItemSku: boolean;
  showItemNotes: boolean;
  showItemDiscounts: boolean;
  showItemTax: boolean;

  // Codes
  showBarcode: boolean;
  showQrCode: boolean;
  qrCodeTarget: 'order-link' | 'review-link' | 'website' | 'survey';
  qrCodeCustomUrl?: string;

  // Visuals
  template: 'standard' | 'minimal' | 'modern' | 'fine-dining' | 'pharmacy' | 'retail' | 'wholesale';
  showBorder: boolean;
  borderColor?: string;

  // Advanced Branding (Enterprise)
  accentColor: string;
  primaryColor: string;
  secondaryColor: string;
  showTagline: boolean;
  tagline: string;

  // Typography (Granular)
  titleFontSize: number;
  headerFontSize: number;
  bodyFontSize: number;
  padding: number;
  dividerStyle: 'solid' | 'dashed' | 'dotted';

  // Compliance & Legal (High-Traffic/Enterprise)
  showVatNumber: boolean;
  vatNumber: string;
  showCompanyRegNumber: boolean;
  companyRegNumber: string;
  showLegalDisclaimer: boolean;
  legalDisclaimerText: string;

  // Enterprise Custom Fields
  customFields: { label: string; value: string; enabled: boolean }[];
  showLocationHeader: boolean;
  locationNameOverride?: string;

  // Localization
  currency: string;
  locale: string;
  currencyPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
  labels: {
    receipt: string;
    date: string;
    cashier: string;
    customer: string;
    item: string;
    qty: string;
    price: string;
    total: string;
    subtotal: string;
    tax: string;
    discount: string;
    savings: string;
    paymentMethod: string;
    change: string;
    servedBy: string;
    vat: string;
    tin: string;
    type: string;
    branch: string;
    reg: string;
    amount: string;
    items: string;
  };

  // Section Reordering
  sectionOrder: string[];

  // Print Automation (High-Traffic)
  printCopies: number;
  autoPrintOnComplete: boolean;
  printCustomerCopy: boolean;
  printMerchantCopy: boolean;

  // Totals & Breakdown Display
  showSubtotal: boolean;
  showTaxBreakdown: boolean;
  showDiscountBreakdown: boolean;
  showSavingsTotal: boolean;

  // Customer Engagement
  showLoyaltyPoints: boolean;
  showLoyaltyBalance: boolean;
  showNextVisitPromo: boolean;
  nextVisitPromoText: string;
  showSurveyQr: boolean;
  surveyUrl: string;
  showThankYouMessage: boolean;
  thankYouMessage: string;

  // Order Tracking
  showOrderNumber: boolean;
  showTransactionId: boolean;
  orderNumberPrefix: string;

  // Signature
  showSignatureLine: boolean;
  signatureLineText: string;
}

export interface KitchenTicketConfig {
  // Basic Display Options
  showTime: boolean;
  showOrderType: boolean;
  showCustomerName: boolean;
  showTable: boolean;
  showPrices: boolean;
  showNotes: boolean;
  fontSize: 'small' | 'medium' | 'large';
  paperSize: '80mm' | '58mm' | 'A5';
  autoPrintCompleted: boolean;

  // Station Routing (High-Traffic Feature)
  enableStationRouting: boolean;
  stations: string[]; // e.g., ['Grill', 'Bar', 'Prep', 'Dessert', 'Expo']
  defaultStation: string;
  printToAllStations: boolean;

  // Priority & Urgency (Rush Hour Handling)
  showPriority: boolean;
  highlightRushOrders: boolean;
  rushOrderColor: string;
  rushOrderThresholdMinutes: number; // Orders older than this are marked rush

  // Allergen & Dietary Alerts
  showAllergens: boolean;
  showDietaryIcons: boolean;
  allergenHighlightColor: string;
  dietaryLabels: string[]; // e.g., ['V', 'VG', 'GF', 'DF', 'H']

  // Print Configuration
  printCopies: number;
  printDelaySeconds: number;
  autoPrintNewOrders: boolean;
  soundAlertOnNewOrder: boolean;

  // Time Management
  showEstimatedPrepTime: boolean;
  showOrderAge: boolean;
  showSequenceNumber: boolean;

  // Auto-Print
  autoPrintKds: boolean;

  // Visual Organization
  compactMode: boolean;
  showCategoryHeaders: boolean;
  showModifiersSeparately: boolean;
  largeQuantityDisplay: boolean;
  showItemSeparators: boolean;

  // Header/Footer Customization
  headerText: string;
  footerText: string;
  showServerName: boolean;
}

export interface PromoSlideConfig {
  id: string;
  type: 'qr' | 'icon';
  title: string;
  subtitle: string;
  payload?: string;
  iconName?: string;
  background: string;
  textColor: string;
  enabled: boolean;
}

export interface CustomerDisplayConfig {
  enabled: boolean;
  welcomeMessage: string;
  subMessage: string;
  showTime: boolean;
  promoSlides: PromoSlideConfig[];
  slideIntervalSeconds: number;
  showCompanyLogo: boolean;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  zoomLevel: number;
}

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'receipt' | 'invoice' | 'label' | 'kitchen';
  connection: 'usb' | 'network' | 'bluetooth';
  ipAddress?: number;
  port?: number;
  isDefault: boolean;
  paperSize: '80mm' | '58mm' | 'a4';
  enabled: boolean;
}

export interface SecurityConfig {
  enableSessionTimeout: boolean;
  sessionTimeoutMinutes: number;
  enableFailedLoginLock: boolean;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  requireStrongPasswords: boolean;
  enableTwoFactorAuth: boolean;
  enableAuditLog: boolean;
  allowedIpAddresses: string[];
  enableDataEncryption: boolean;
}

export interface BusinessSettings {
  businessName: string;
  businessType: BusinessType;
  currency: string;
  taxRate: number;
  sidebarItems: SidebarItem[];
  receiptConfig: ReceiptConfig;
  allowSaveUnpaidOrders: boolean;
  enableCustomerManagement: boolean;
  enableEmployeeManagement: boolean;
  enableLowStockAlerts: boolean;
  lowStockThreshold: number;
  enableCashDrawer: boolean;
  requireEmployeePin: boolean;
  enableAutoPrint: boolean;
  printerName: string;
  enableEmailReceipts: boolean;
  themeConfig: ThemeConfig;
  printers: PrinterConfig[];
  securityConfig: SecurityConfig;
  notificationSettings: NotificationSettings;
  autoPrintConfig: AutoPrintConfig; // Auto-print configuration
  paybillNumber?: string;
  tillNumber?: string;
  enableCustomerDisplay: boolean;
  customerDisplayConfig: CustomerDisplayConfig;
  kitchenTicketConfig: KitchenTicketConfig;
  cashDrawerPort?: string; // Serial port for cash drawer hardware (e.g., "COM3")
  enableAutoStart: boolean;
  enableBarcodeScanner: boolean;

  // KDS System
  enableKdsSystem: boolean;

  // Multi-user / Shift Settings
  shareCartBetweenUsers: boolean;
  shareShiftBetweenUsers: boolean;
  enableAutoShiftPrompt: boolean;
  enforceShiftForCashPayments: boolean;

  // Hold Sale Settings (Enterprise)
  enableHoldSale: boolean;
  maxHeldOrders: number;
  heldOrderExpiryHours?: number;
  requireHoldReason: boolean;
  forcedImmediateSyncThreshold: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalPurchases: number;
  lastVisit: Date;
  loyaltyPoints: number;
  notes?: string;
  customerType?: 'retail' | 'b2b';
  businessName?: string;
  taxId?: string;
  creditLimit?: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'manager' | 'admin';
  pin: string;
  active: boolean;
  hireDate: Date;
}

export interface CashDrawer {
  id: string;
  employeeId: string;
  employeeName: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  difference?: number;
  status: 'open' | 'closed';
  transactions: {
    type: 'sale' | 'refund' | 'cash-in' | 'cash-out';
    amount: number;
    timestamp: Date;
    orderId?: string;
    notes?: string;
  }[];
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  alertType: 'low' | 'out';
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalOrders: number;
  totalTax: number;
  totalDiscount: number;
  paymentMethods: Record<string, number>;
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
}

// Added Table interface
export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
  guestsCount?: number;
  occupiedAt?: string;
  section?: string;
  notes?: string;
}

interface PosStore {
  userCarts: Record<string, {
    customerName: string;
    orderType: OrderType;
    items: OrderItem[];
    tableNumber?: string;
    instructions?: string;
    metadata?: Record<string, any>;
    customerId?: string;
    customerPhone?: string;
    loyaltyPoints?: number;
    prescriptionId?: string;
    doctorName?: string;
    isPharmacistVerified?: boolean;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceAmount?: number;
  }>;
  currentOrder: {
    customerName: string;
    orderType: OrderType;
    items: OrderItem[];
    tableNumber?: string;
    instructions?: string;
    metadata?: Record<string, any>;
    customerId?: string;
    customerPhone?: string;
    loyaltyPoints?: number;

    // Pharmacy features
    prescriptionId?: string;
    doctorName?: string;
    isPharmacistVerified?: boolean;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceAmount?: number;
  };

  orders: Order[];
  products: Product[];
  settings: BusinessSettings;
  lastCompletedOrder: Order | null;

  employees: Employee[];
  cashDrawers: CashDrawer[];
  currentEmployeeId: string | null;
  activeCashDrawerId: string | null;

  notifications: Notification[];
  unreadNotificationCount: number;

  // Location
  currentLocationId: string | null;
  setCurrentLocationId: (id: string | null) => void;

  // Added tables and related methods
  tables: Table[];
  fetchTables: () => Promise<void>;
  addTable: (table: Omit<Table, 'id'>) => Promise<void>;
  updateTable: (id: string, table: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  setTableStatus: (id: string, status: Table['status']) => Promise<void>;
  assignOrderToTable: (tableId: string, orderId: string, guestsCount?: number) => Promise<void>;
  clearTableOrder: (tableId: string) => Promise<void>;

  getBusinessConfig: () => ReturnType<typeof getBusinessConfig>;

  setCustomerName: (name: string) => void;
  setCustomerId: (id: string) => void;
  setCustomer: (customer: Customer) => void;
  setOrderType: (type: OrderType) => void;
  addItemToOrder: (product: Product, variantId: string, unit: SellableUnit, quantity: number, options?: { isWholesale?: boolean }) => void;
  updateItemQuantity: (productId: string, variantId: string, unitId: string, quantity: number) => void;
  updateItemInOrder: (item: OrderItem) => void;
  removeItemFromOrder: (productId: string, variantId: string, unitId: string) => void;
  setProducts: (products: Product[]) => void;
  resetOrder: () => void;
  resetStore: () => void;
  completeOrder: (paymentMethod: string, discountAmount: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  updateBusinessSettings: (settings: Partial<BusinessSettings>) => void;
  toggleSidebarItem: (itemId: string) => void;
  changeBusinessType: (type: BusinessType) => void;
  updateReceiptConfig: (config: Partial<ReceiptConfig>) => void;
  saveUnpaidOrder: (discountAmount: number) => void;

  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  loginEmployee: (pin: string) => boolean;
  logoutEmployee: () => void;

  openCashDrawer: (openingBalance: number) => void;
  closeCashDrawer: (closingBalance: number) => void;
  addCashTransaction: (type: 'cash-in' | 'cash-out', amount: number, notes?: string) => void;

  updateProductStock: (productId: string, newStock: number) => void;
  deductStockForOrderItems: (items: any[]) => void;
  getLowStockProducts: () => InventoryAlert[];
  getDailySummary: (date: string) => DailySummary;
  getTopProducts: (limit: number) => {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];

  printReceipt: (orderId: string) => void;
  emailReceipt: (orderId: string, email: string) => void;

  addPrinter: (printer: Omit<PrinterConfig, 'id'>) => void;
  updatePrinter: (id: string, printer: Partial<PrinterConfig>) => void;
  deletePrinter: (id: string) => void;
  setDefaultPrinter: (id: string) => void;

  updateThemeConfig: (config: Partial<ThemeConfig>) => void;

  updateSecurityConfig: (config: Partial<SecurityConfig>) => void;

  updateAutoPrintConfig: (config: Partial<AutoPrintConfig>) => void;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  swapUserCart: (fromMemberId: string, toMemberId: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  simulateOnlineOrder: () => void;
  checkLowStockAlerts: () => void;

  setTableNumber: (tableNumber: string, guestsCount?: number) => void;
  recallUnpaidOrder: (orderId: string) => void;
  setInstructions: (instructions: string) => void;
  updateKitchenTicketConfig: (config: Partial<KitchenTicketConfig>) => void;
  updateCustomerDisplayConfig: (config: Partial<CustomerDisplayConfig>) => void;

  // Held Orders (Enterprise Hold Sale Feature)
  heldOrders: HeldOrder[];
  holdCurrentOrder: (reason?: string, priority?: HeldOrderPriority) => void;
  retrieveHeldOrder: (id: string) => void;
  deleteHeldOrder: (id: string) => void;
  clearAllHeldOrders: () => void;
  updateHeldOrderPriority: (id: string, priority: HeldOrderPriority) => void;
  dangerouslyResetEverything: () => void;
}

export const getDefaultReceiptConfig = (): ReceiptConfig => ({
  // Branding
  showLogo: true,
  logoUrl: '',
  logoWidth: 50,
  logoPosition: 'center',

  // Business Details
  headerText: 'Thank you for your purchase!',
  footerText: 'Please come again',
  showAddress: true,
  address: '123 Main Street, City, Country',
  showPhone: true,
  phone: '+1 234 567 8900',
  showEmail: true,
  email: 'contact@business.com',
  showTaxNumber: true,
  taxNumber: 'TAX-123456789',
  showWebsite: true,
  website: 'www.business.com',

  // Enterprise / Social
  showSocialMedia: false,
  socialMediaHandle: '',
  showReturnPolicy: false,
  returnPolicyText: 'Items may be returned within 7 days of purchase with original receipt.',

  // Layout & Typography
  paperSize: '80mm',
  fontFamily: 'monospace',
  fontSize: 'medium',
  textAlignment: 'center',
  marginHorizontal: 0,
  itemSpacing: 2,

  // Content Granularity
  dateFormat: "dd MMM yyyy 'at' hh:mm a",
  showCashier: true,
  showCustomerName: true,
  showOrderType: true,
  showPaymentMethod: true,
  showItemSku: false,
  showItemNotes: true,
  showItemDiscounts: false,
  showItemTax: false,

  // Codes
  showBarcode: true,
  showQrCode: false,
  qrCodeTarget: 'order-link',
  qrCodeCustomUrl: '',

  // Visuals
  template: 'standard',
  showBorder: false,
  borderColor: '#000000',

  // Advanced Branding (Enterprise)
  accentColor: '#2563eb',
  primaryColor: '#000000',
  secondaryColor: '#666666',
  showTagline: false,
  tagline: '',

  // Typography (Granular)
  titleFontSize: 14,
  headerFontSize: 10,
  bodyFontSize: 8,
  padding: 8,
  dividerStyle: 'dashed',

  // Compliance & Legal
  showVatNumber: false,
  vatNumber: '',
  showCompanyRegNumber: false,
  companyRegNumber: '',
  showLegalDisclaimer: false,
  legalDisclaimerText: '',

  // Enterprise Custom Fields
  customFields: [
    { label: 'KRA PIN', value: '', enabled: false },
    { label: 'KRA ETR', value: '', enabled: false },
  ],
  showLocationHeader: false,

  // Localization
  currency: 'USD',
  locale: 'en-US',
  currencyPosition: 'before',
  thousandsSeparator: ',',
  decimalSeparator: '.',
  labels: {
    receipt: 'RECEIPT',
    date: 'DATE',
    cashier: 'CASHIER',
    customer: 'CUSTOMER',
    item: 'ITEM',
    qty: 'QTY',
    price: 'PRICE',
    total: 'TOTAL',
    subtotal: 'SUBTOTAL',
    tax: 'TAX',
    discount: 'DISCOUNT',
    savings: 'SAVINGS',
    paymentMethod: 'PAYMENT METHOD',
    change: 'CHANGE',
    servedBy: 'SERVED BY',
    vat: 'VAT',
    tin: 'TIN',
    type: 'TYPE',
    branch: 'BRANCH',
    reg: 'REG',
    amount: 'AMT',
    items: 'ITEMS',
  },

  // Section Reordering
  sectionOrder: ['header', 'meta', 'items', 'totals', 'footer', 'codes'],

  // Print Automation
  printCopies: 1,
  autoPrintOnComplete: false,
  printCustomerCopy: true,
  printMerchantCopy: false,

  // Totals & Breakdown Display
  showSubtotal: true,
  showTaxBreakdown: true,
  showDiscountBreakdown: true,
  showSavingsTotal: false,

  // Customer Engagement
  showLoyaltyPoints: false,
  showLoyaltyBalance: false,
  showNextVisitPromo: false,
  nextVisitPromoText: 'Visit again for 10% off!',
  showSurveyQr: false,
  surveyUrl: '',
  showThankYouMessage: true,
  thankYouMessage: 'Thank you for dining with us!',

  // Order Tracking
  showOrderNumber: true,
  showTransactionId: false,
  orderNumberPrefix: 'ORD-',

  // Signature
  showSignatureLine: false,
  signatureLineText: 'Customer Signature',
});

export const getDefaultKitchenTicketConfig = (): KitchenTicketConfig => ({
  // Basic Display Options
  showTime: true,
  showOrderType: true,
  showCustomerName: true,
  showTable: true,
  showPrices: false,
  showNotes: true,
  fontSize: 'medium',
  paperSize: '80mm',
  autoPrintCompleted: false,

  // Station Routing (High-Traffic)
  enableStationRouting: false,
  stations: ['Grill', 'Bar', 'Prep', 'Dessert', 'Expo'],
  defaultStation: 'Expo',
  printToAllStations: false,

  // Priority & Urgency (Rush Hour)
  showPriority: true,
  highlightRushOrders: true,
  rushOrderColor: '#ef4444',
  rushOrderThresholdMinutes: 15,

  // Allergen & Dietary Alerts
  showAllergens: true,
  showDietaryIcons: true,
  allergenHighlightColor: '#f59e0b',
  dietaryLabels: ['V', 'VG', 'GF', 'DF', 'H'],

  // Print Configuration
  printCopies: 1,
  printDelaySeconds: 0,
  autoPrintNewOrders: true,
  soundAlertOnNewOrder: true,

  // Time Management
  showEstimatedPrepTime: false,
  showOrderAge: true,
  showSequenceNumber: true,

  // Auto-Print
  autoPrintKds: false,

  // Visual Organization
  compactMode: false,
  showCategoryHeaders: true,
  showModifiersSeparately: true,
  largeQuantityDisplay: true,
  showItemSeparators: true,

  // Header/Footer Customization
  headerText: 'KITCHEN ORDER',
  footerText: '',
  showServerName: true,
});

const getDefaultThemeConfig = (): ThemeConfig => ({
  mode: 'light',
  primaryColor: 'oklch(0.42 0.145 265)',
  accentColor: 'oklch(0.96 0.005 240)',
  fontSize: 'medium',
  compactMode: false,
  zoomLevel: 100, // Default 100%
});

const getDefaultPrinters = (): PrinterConfig[] => [
  {
    id: 'printer_default',
    name: 'Default Receipt Printer',
    type: 'receipt',
    connection: 'usb',
    isDefault: true,
    paperSize: '80mm',
    enabled: true,
  },
];

const getDefaultSecurityConfig = (): SecurityConfig => ({
  enableSessionTimeout: true,
  sessionTimeoutMinutes: 30,
  enableFailedLoginLock: true,
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 15,
  requireStrongPasswords: true,
  enableTwoFactorAuth: false,
  enableAuditLog: true,
  allowedIpAddresses: [],
  enableDataEncryption: false,
});

const getDefaultNotificationSettings = (): NotificationSettings => ({
  enabled: true,
  soundEnabled: true,
  showOnlineOrders: true,
  showLowStock: true,
  showSystemAlerts: true,
  position: 'top-right',
  autoCloseDelay: 5000,
});

export const usePosStore = create<PosStore>()(
  persist(
    (set, get) => ({
      currentLocationId: null,
      setCurrentLocationId: id => set({ currentLocationId: id }),

      userCarts: {},
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
        prescriptionId: '',
        doctorName: '',
        isPharmacistVerified: false,
        insuranceProvider: '',
        insurancePolicyNumber: '',
        insuranceAmount: 0,
      },
      orders: [],
      products: [],
      lastCompletedOrder: null,
      settings: {
        businessName: 'Scryme',
        businessType: 'restaurant',
        currency: 'KSH',
        taxRate: 2,
        sidebarItems: getDefaultSidebarItems('restaurant'),
        receiptConfig: getDefaultReceiptConfig(),
        allowSaveUnpaidOrders: true,
        enableCustomerManagement: true,
        enableEmployeeManagement: true,
        enableLowStockAlerts: true,
        lowStockThreshold: 10,
        enableCashDrawer: true,
        requireEmployeePin: false,
        enableAutoPrint: false,
        printerName: '',
        enableEmailReceipts: false,
        themeConfig: getDefaultThemeConfig(),
        printers: getDefaultPrinters(),
        securityConfig: getDefaultSecurityConfig(),
        notificationSettings: getDefaultNotificationSettings(),
        autoPrintConfig: DEFAULT_AUTO_PRINT_CONFIG, // Auto-print configuration
        paybillNumber: '',
        tillNumber: '',
        enableCustomerDisplay: true,
        customerDisplayConfig: {
          enabled: true,
          welcomeMessage: 'Scryme Enterprise',
          subMessage: 'Welcome to our store',
          showTime: true,
          slideIntervalSeconds: 8,
          showCompanyLogo: true,
          promoSlides: [
            {
              id: 'slide_1',
              type: 'qr',
              title: 'Join & Save 5%',
              subtitle: 'Scan to register instantly',
              payload: 'https://example.com/register',
              background: 'bg-gradient-to-br from-indigo-600 to-blue-700',
              textColor: 'text-white',
              enabled: true,
            },
            {
              id: 'slide_2',
              type: 'icon',
              title: 'New Arrivals',
              subtitle: 'Ask about our seasonal catalog',
              iconName: 'Store',
              background: 'bg-gradient-to-br from-emerald-600 to-teal-700',
              textColor: 'text-white',
              enabled: true,
            },
            {
              id: 'slide_3',
              type: 'icon',
              title: 'Secure Payments',
              subtitle: 'We accept all major cards',
              iconName: 'ShieldCheck',
              background: 'bg-gradient-to-br from-slate-700 to-gray-800',
              textColor: 'text-white',
              enabled: true,
            },
          ],
        },
        kitchenTicketConfig: getDefaultKitchenTicketConfig(),
        cashDrawerPort: '', // No port configured by default
        enableAutoStart: false,
        enableBarcodeScanner: true,
        enableKdsSystem: false,
        // Multi-user / Shift Settings
        shareCartBetweenUsers: true,
        shareShiftBetweenUsers: true,
        enableAutoShiftPrompt: false,
        enforceShiftForCashPayments: false,
        // Hold Sale Settings (Enterprise)
        enableHoldSale: true,
        maxHeldOrders: 20,
        heldOrderExpiryHours: 24,
        requireHoldReason: false,
        forcedImmediateSyncThreshold: 1000,
      },
      employees: [],
      notifications: [],
      cashDrawers: [],
      currentEmployeeId: null,
      activeCashDrawerId: null,
      isCheckedIn: false,
      unreadNotificationCount: 0,

      // Held Orders (Enterprise)
      heldOrders: [],

      // Initialize tables as empty (will be fetched from DB)
      tables: [],

      getBusinessConfig: () => {
        return getBusinessConfig(get().settings.businessType);
      },

      setCustomerName: name =>
        set(state => ({
          currentOrder: { ...state.currentOrder, customerName: name },
        })),

      setCustomerId: id =>
        set(state => ({
          currentOrder: { ...state.currentOrder, customerId: id },
        })),

      setCustomer: customer =>
        set(state => ({
          currentOrder: {
            ...state.currentOrder,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            loyaltyPoints: customer.loyaltyPoints,
          },
        })),

      setOrderType: type =>
        set(state => ({
          currentOrder: { ...state.currentOrder, orderType: type },
        })),

      addItemToOrder: (product, variantId, unit, quantity, options) =>
        set(state => {
          const existingItemIndex = state.currentOrder.items.findIndex(
            i =>
              i.productId === product.productId &&
              i.variantId === variantId &&
              i.selectedUnit.unitId === unit.unitId &&
              i.isWholesale === options?.isWholesale
          );

          if (existingItemIndex >= 0) {
            const updatedItems = [...state.currentOrder.items];
            updatedItems[existingItemIndex].quantity += quantity;
            return {
              currentOrder: { ...state.currentOrder, items: updatedItems },
            };
          }

          // Find the variant name from the variants array
          const variant = product.variants?.find(v => v.variantId === variantId);
          const variantName = variant?.name || 'Default Variant';

          const newItem: OrderItem = {
            productId: product.productId,
            variantId: variantId,
            productName: product.name || product.productName, // Use productName which is required
            variantName: variantName || 'Default Variant',
            selectedUnit: unit,
            price: (unit as any).price, // Ensure price is set at root
            quantity,
            imageUrl: product.imageUrl,
            isWholesale: options?.isWholesale || false,
            // Pharmacy Check: if category is "Prescription" or "Medicine"
            requiresPrescription: product.category.toLowerCase().includes('prescription') || product.category.toLowerCase().includes('medicine'),
          };

          return {
            currentOrder: {
              ...state.currentOrder,
              items: [...state.currentOrder.items, newItem],
            },
          };
        }),

      updateItemQuantity: (productId, variantId, unitId, quantity) =>
        set(state => ({
          currentOrder: {
            ...state.currentOrder,
            items: state.currentOrder.items.map(item =>
              item.productId === productId && item.variantId === variantId && item.selectedUnit.unitId === unitId ? { ...item, quantity } : item
            ),
          },
        })),

      updateItemInOrder: updatedItem =>
        set(state => {
          const originalUnitId = (updatedItem as any).originalUnitId || updatedItem.selectedUnit.unitId;

          // 1. Identify the item being edited
          const items = state.currentOrder.items.map(item => {
            if (
              item.productId === updatedItem.productId &&
              item.variantId === updatedItem.variantId &&
              item.selectedUnit.unitId === originalUnitId
            ) {
              return { ...item, ...updatedItem };
            }
            return item;
          });

          // 2. Check for duplicates (if unit was changed to one that already exists)
          // We'll do a simple merge if we find two items with same (product, variant, unit, isWholesale)
          const mergedItems: OrderItem[] = [];
          items.forEach(item => {
            const existing = mergedItems.find(
              m =>
                m.productId === item.productId &&
                m.variantId === item.variantId &&
                m.selectedUnit.unitId === item.selectedUnit.unitId &&
                m.isWholesale === item.isWholesale
            );

            if (existing) {
              existing.quantity += item.quantity;
              // Keep notes if they were added
              if (item.notes) {
                existing.notes = existing.notes ? `${existing.notes}; ${item.notes}` : item.notes;
              }
            } else {
              mergedItems.push({ ...item });
            }
          });

          return {
            currentOrder: {
              ...state.currentOrder,
              items: mergedItems,
            },
          };
        }),

      removeItemFromOrder: (productId, variantId, unitId) =>
        set(state => ({
          currentOrder: {
            ...state.currentOrder,
            items: state.currentOrder.items.filter(
              item => !(item.productId === productId && item.variantId === variantId && item.selectedUnit.unitId === unitId)
            ),
          },
        })),

      setProducts: products => set({ products }),

      resetStore: () =>
        set({
          products: [],

          orders: [],
          employees: [],
          notifications: [],
          heldOrders: [],
          // Keep settings as is? User said "invalidate the products and the customers".
          // We don't want to wipe business settings like tax rate etc unless requested.
          // But "Device Reset" usually means clean slate.
          // Let's safe clear transactional data.
          lastCompletedOrder: null,
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
          // Clear caches if any
        }),

      dangerouslyResetEverything: () => {
        set({
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
            businessName: 'Scryme',
            businessType: 'retail' as BusinessType,
            currency: 'USD',
            taxRate: 16,
            // address: '',
            // phone: '',
            // email: '',
            // website: '',
            receiptConfig: getDefaultReceiptConfig(),
            allowSaveUnpaidOrders: true,
            enableCustomerManagement: true,
            enableEmployeeManagement: true,
            enableLowStockAlerts: true,
            requireHoldReason: false,
            sidebarItems: getDefaultSidebarItems('retail'),
            lowStockThreshold: 10,
            enableCashDrawer: true,
            requireEmployeePin: false,
            enableAutoPrint: false,
            printerName: '',
            enableEmailReceipts: false,
            themeConfig: getDefaultThemeConfig(),
            printers: getDefaultPrinters(),
            securityConfig: getDefaultSecurityConfig(),
            notificationSettings: getDefaultNotificationSettings(),
            autoPrintConfig: DEFAULT_AUTO_PRINT_CONFIG,
            paybillNumber: '',
            tillNumber: '',
            enableCustomerDisplay: true,
            customerDisplayConfig: {
              enabled: true,
              welcomeMessage: 'Scryme Enterprise',
              subMessage: 'Welcome to our store',
              showTime: true,
              slideIntervalSeconds: 8,
              showCompanyLogo: true,
              promoSlides: [
                {
                  id: 'slide_1',
                  type: 'qr',
                  title: 'Join & Save 5%',
                  subtitle: 'Scan to register instantly',
                  payload: 'https://example.com/register',
                  background: 'bg-gradient-to-br from-indigo-600 to-blue-700',
                  textColor: 'text-white',
                  enabled: true,
                },
                {
                  id: 'slide_2',
                  type: 'icon',
                  title: 'New Arrivals',
                  subtitle: 'Ask about our seasonal catalog',
                  iconName: 'Store',
                  background: 'bg-gradient-to-br from-emerald-600 to-teal-700',
                  textColor: 'text-white',
                  enabled: true,
                },
                {
                  id: 'slide_3',
                  type: 'icon',
                  title: 'Secure Payments',
                  subtitle: 'We accept all major cards',
                  iconName: 'ShieldCheck',
                  background: 'bg-gradient-to-br from-slate-700 to-gray-800',
                  textColor: 'text-white',
                  enabled: true,
                },
              ],
            },
            kitchenTicketConfig: getDefaultKitchenTicketConfig(),
            cashDrawerPort: '',
            enableAutoStart: false,
            enableBarcodeScanner: true,
            enableKdsSystem: false,
            enableHoldSale: true,
            maxHeldOrders: 20,
            heldOrderExpiryHours: 24,
            shareCartBetweenUsers: true,
            shareShiftBetweenUsers: true,
            enableAutoShiftPrompt: false,
            enforceShiftForCashPayments: false,
            forcedImmediateSyncThreshold: 1000,
          },
          employees: [],
          notifications: [],
          cashDrawers: [],
          currentEmployeeId: null,
          activeCashDrawerId: null,

          unreadNotificationCount: 0,
          heldOrders: [],
          tables: [
            { id: 'table_1', number: '1', capacity: 4, status: 'available', section: 'Main Hall' },
            { id: 'table_2', number: '2', capacity: 2, status: 'available', section: 'Main Hall' },
            { id: 'table_3', number: '3', capacity: 6, status: 'available', section: 'Main Hall' },
            { id: 'table_4', number: '4', capacity: 4, status: 'available', section: 'Patio' },
            { id: 'table_5', number: '5', capacity: 8, status: 'available', section: 'VIP' },
          ],
        });
      },

      resetOrder: () => {
        posthog.capture("cart_cleared");
        set({
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
        });
      },

      completeOrder: async (paymentMethod, discountAmount) => {
        const state = get();
        const totalWithTax = state.currentOrder.items.reduce((sum, item) => {
          const itemPrice = item.selectedUnit?.price ?? 0;
          return sum + itemPrice * item.quantity;
        }, 0);

        const taxes = (totalWithTax * state.settings.taxRate) / (100 + state.settings.taxRate);
        const subTotal = totalWithTax - taxes;
        const discount = discountAmount;
        const finalTotal = totalWithTax - discount;

        const newOrder: Order = {
          id: Date.now().toString(),
          orderNumber: `#${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: state.currentOrder.customerName || 'Walk-in Customer',
          orderType: state.currentOrder.orderType,
          status: 'completed',
          items: [...state.currentOrder.items],
          createdAt: new Date(),
          subTotal: subTotal - discount,
          discount,
          taxes: taxes - (taxes * discount) / totalWithTax,
          total: finalTotal,
          paymentMethod,
          tableNumber: state.currentOrder.tableNumber,
          instructions: state.currentOrder.instructions,
          metadata: state.currentOrder.metadata,
          customerId: state.currentOrder.customerId,
        };

        // --- Logic: Handle Cash Drawer ---
        let updatedDrawers = state.cashDrawers;
        if (state.activeCashDrawerId && paymentMethod === 'cash') {
          updatedDrawers = state.cashDrawers.map(drawer =>
            drawer.id === state.activeCashDrawerId
              ? {
                  ...drawer,
                  transactions: [
                    ...drawer.transactions,
                    {
                      type: 'sale' as const,
                      amount: totalWithTax,
                      timestamp: new Date(),
                      orderId: newOrder.id,
                    },
                  ],
                }
              : drawer
          );
        }

        // --- Logic: Find Table to Clear ---
        const tableToClear = state.tables.find(
          t => t.number === state.currentOrder.tableNumber || 
               t.currentOrderId === state.currentOrder.metadata?.orderId
        );

        // Broadcast to Kitchen if enabled
        if (state.settings.enableKdsSystem) {
           sendOrderToKitchen(newOrder);
        }

        // Update State
        set({
          orders: [newOrder, ...state.orders],
          lastCompletedOrder: newOrder,
          cashDrawers: updatedDrawers,
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
        });

        // Backend Update: Clear Table
        if (tableToClear) {
          try {
            await invoke('update_table_status_command', {
              id: tableToClear.id,
              status: 'available',
              orderId: null,
              guestsCount: null,
            });
            get().fetchTables();
          } catch (error) {
            console.error('Failed to clear table in backend:', error);
          }
        }
      },

      updateOrderStatus: (orderId, status) =>
        set(state => ({
          orders: state.orders.map(order => (order.id === orderId ? { ...order, status } : order)),
        })),

      updateBusinessSettings: newSettings =>
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        })),

      toggleSidebarItem: itemId =>
        set(state => ({
          settings: {
            ...state.settings,
            sidebarItems: state.settings.sidebarItems.map(item =>
              item.id === itemId ? { ...item, enabled: !item.enabled } : item
            ),
          },
        })),

      changeBusinessType: (type: BusinessType) =>
        set(state => {
          const config = getBusinessConfig(type);
          return {
            settings: {
              ...state.settings,
              businessType: type,
              taxRate: config.taxSettings.defaultRate,
              sidebarItems: getDefaultSidebarItems(type),
            },
          };
        }),
      updateReceiptConfig: config =>
        set(state => ({
          settings: {
            ...state.settings,
            receiptConfig: { ...state.settings.receiptConfig, ...config },
          },
        })),

      saveUnpaidOrder: async discountAmount => {
        const state = get();
        const totalWithTax = state.currentOrder.items.reduce((sum, item) => {
          const itemPrice = item.selectedUnit?.price ?? 0;
          return sum + itemPrice * item.quantity;
        }, 0);

        const taxes = (totalWithTax * state.settings.taxRate) / (100 + state.settings.taxRate);
        const subTotal = totalWithTax - taxes;
        const discount = discountAmount;
        const finalTotal = totalWithTax - discount;

        const newOrder: Order = {
          id: Date.now().toString(),
          orderNumber: `#${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: state.currentOrder.customerName || 'Walk-in Customer',
          orderType: state.currentOrder.tableNumber ? 'dine-in' : state.currentOrder.orderType as any,
          status: 'waiting',
          items: [...state.currentOrder.items],
          createdAt: new Date(),
          subTotal: subTotal - discount,
          discount,
          taxes: taxes - (taxes * discount) / totalWithTax,
          total: finalTotal,
          paymentMethod: 'pending' as any,
          tableNumber: state.currentOrder.tableNumber,
          instructions: state.currentOrder.instructions,
          metadata: {
            ...state.currentOrder.metadata,
            createdAt: Date.now(),
          },
          customerId: state.currentOrder.customerId,
        };

        // Broadcast to Kitchen if enabled
        if (state.settings.enableKdsSystem) {
          sendOrderToKitchen(newOrder);
        }

        // Update State
        set({
          orders: [newOrder, ...state.orders],
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
        });

        // Backend Update: Mark Table as Occupied
        if (state.currentOrder.tableNumber) {
          const tableToOccupy = state.tables.find(t => t.number === state.currentOrder.tableNumber);
          if (tableToOccupy) {
            try {
              await invoke('update_table_status_command', {
                id: tableToOccupy.id,
                status: 'occupied',
                orderId: newOrder.id,
                guestsCount: state.currentOrder.metadata?.guestsCount || null,
              });
              get().fetchTables();
            } catch (error) {
              console.error('Failed to occupy table in backend:', error);
            }
          }
        }
      },

      addEmployee: employee =>
        set(state => ({
          employees: [
            ...state.employees,
            {
              ...employee,
              id: `emp_${Date.now()}`,
            },
          ],
        })),

      updateEmployee: (id, employee) =>
        set(state => ({
          employees: state.employees.map(e => (e.id === id ? { ...e, ...employee } : e)),
        })),

      deleteEmployee: id =>
        set(state => ({
          employees: state.employees.filter(e => e.id !== id),
        })),

      loginEmployee: pin => {
        const state = get();
        const employee = state.employees.find(e => e.pin === pin && e.active);
        if (employee) {
          set({ currentEmployeeId: employee.id });
          return true;
        }
        return false;
      },

      logoutEmployee: () => set({ currentEmployeeId: null }),

      openCashDrawer: openingBalance =>
        set(state => {
          const employee = state.employees.find(e => e.id === state.currentEmployeeId);
          const newDrawer: CashDrawer = {
            id: `drawer_${Date.now()}`,
            employeeId: state.currentEmployeeId || 'unknown',
            employeeName: employee?.name || 'Unknown',
            openedAt: new Date(),
            openingBalance,
            status: 'open',
            transactions: [],
          };

          return {
            cashDrawers: [...state.cashDrawers, newDrawer],
            activeCashDrawerId: newDrawer.id,
          };
        }),

      closeCashDrawer: closingBalance =>
        set(state => {
          if (!state.activeCashDrawerId) return state;

          const drawer = state.cashDrawers.find(d => d.id === state.activeCashDrawerId);
          if (!drawer) return state;

          const totalSales = drawer.transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
          const totalCashIn = drawer.transactions
            .filter(t => t.type === 'cash-in')
            .reduce((sum, t) => sum + t.amount, 0);
          const totalCashOut = drawer.transactions
            .filter(t => t.type === 'cash-out')
            .reduce((sum, t) => sum + t.amount, 0);
          const totalRefunds = drawer.transactions
            .filter(t => t.type === 'refund')
            .reduce((sum, t) => sum + t.amount, 0);

          const expectedBalance = drawer.openingBalance + totalSales + totalCashIn - totalCashOut - totalRefunds;

          const updatedDrawers = state.cashDrawers.map(d =>
            d.id === state.activeCashDrawerId
              ? {
                  ...d,
                  closedAt: new Date(),
                  closingBalance,
                  expectedBalance,
                  difference: closingBalance - expectedBalance,
                  status: 'closed' as const,
                }
              : d
          );

          return {
            cashDrawers: updatedDrawers,
            activeCashDrawerId: null,
          };
        }),

      addCashTransaction: (type, amount, notes) =>
        set(state => {
          if (!state.activeCashDrawerId) return state;

          const updatedDrawers = state.cashDrawers.map(drawer =>
            drawer.id === state.activeCashDrawerId
              ? {
                  ...drawer,
                  transactions: [
                    ...drawer.transactions,
                    {
                      type,
                      amount,
                      timestamp: new Date(),
                      notes,
                    },
                  ],
                }
              : drawer
          );

          return { cashDrawers: updatedDrawers };
        }),

      updateProductStock: (productId, newStock) =>
        set(state => ({
          products: state.products.map(p => (p.productId === productId ? { ...p, stock: newStock } : p)),
        })),

      deductStockForOrderItems: items =>
        set(state => {
          const newProducts = [...state.products];
          let updated = false;

          for (const item of items) {
            const productIndex = newProducts.findIndex(p => p.productId === item.productId);
            if (productIndex !== -1) {
              const conversion = item.selectedUnit?.conversion || 1;
              const deductedAmount = item.quantity * conversion;

              const product = newProducts[productIndex];
              newProducts[productIndex] = {
                ...product,
                stock: Math.max(0, product.stock - deductedAmount),
              };
              updated = true;
            }
          }

          if (updated) {
            return { products: newProducts };
          }
          return {};
        }),

      getLowStockProducts: () => {
        const state = get();
        return state.products
          .filter(p => p.stock <= state.settings.lowStockThreshold)
          .map(p => ({
            productId: p.productId,
            productName: p.productName,
            currentStock: p.stock,
            minimumStock: state.settings.lowStockThreshold,
            alertType: p.stock === 0 ? ('out' as const) : ('low' as const),
          }));
      },

      getDailySummary: date => {
        const state = get();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const dayOrders = state.orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startOfDay && orderDate <= endOfDay && order.status === 'completed';
        });

        const totalSales = dayOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = dayOrders.length;
        const totalTax = dayOrders.reduce((sum, order) => sum + order.taxes, 0);
        const totalDiscount = dayOrders.reduce((sum, order) => sum + order.discount, 0);

        const paymentMethods: Record<string, number> = {};
        dayOrders.forEach(order => {
          paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + order.total;
        });

        const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
        dayOrders.forEach(order => {
          order.items.forEach(item => {
            if (!productStats[item.productId]) {
              productStats[item.productId] = {
                name: item.productName,
                quantity: 0,
                revenue: 0,
              };
            }
            productStats[item.productId].quantity += item.quantity;
            productStats[item.productId].revenue += (item.selectedUnit?.price ?? 0) * item.quantity;
          });
        });

        const topProducts = Object.entries(productStats)
          .map(([productId, stats]) => ({
            productId,
            productName: stats.name,
            quantity: stats.quantity,
            revenue: stats.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        return {
          date,
          totalSales,
          totalOrders,
          totalTax,
          totalDiscount,
          paymentMethods,
          topProducts,
        };
      },

      getTopProducts: limit => {
        const state = get();
        const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};

        state.orders
          .filter(order => order.status === 'completed')
          .forEach(order => {
            order.items.forEach(item => {
              if (!productStats[item.productId]) {
                productStats[item.productId] = {
                  name: item.productName,
                  quantity: 0,
                  revenue: 0,
                };
              }
              productStats[item.productId].quantity += item.quantity;
              productStats[item.productId].revenue += (item.selectedUnit?.price ?? 0) * item.quantity;
            });
          });

        return Object.entries(productStats)
          .map(([productId, stats]) => ({
            productId,
            productName: stats.name,
            quantity: stats.quantity,
            revenue: stats.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, limit);
      },

      printReceipt: orderId => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return;

        console.log(' Printing receipt for order:', orderId);
        if (window && 'print' in window) {
          window.print();
        }
      },

      emailReceipt: (orderId, email) => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return;

        console.log(' Emailing receipt for order:', orderId, 'to:', email);
        // In a real implementation, this would call an API to send the email
      },

      addPrinter: (printer: Omit<PrinterConfig, 'id'>) =>
        set(state => {
          const newPrinter: PrinterConfig = {
            ...printer,
            id: `printer_${Date.now()}`,
          };

          // If this is set as default, unset other defaults
          let printers = state.settings.printers;
          if (newPrinter.isDefault) {
            printers = printers.map(p => ({ ...p, isDefault: false }));
          }

          return {
            settings: {
              ...state.settings,
              printers: [...printers, newPrinter],
            },
          };
        }),

      updatePrinter: (id: string, printer: Partial<PrinterConfig>) =>
        set(state => {
          let printers = state.settings.printers.map(p => (p.id === id ? { ...p, ...printer } : p));

          // If this printer is being set as default, unset others
          if (printer.isDefault === true) {
            printers = printers.map(p => (p.id === id ? { ...p, isDefault: true } : { ...p, isDefault: false }));
          }

          return {
            settings: {
              ...state.settings,
              printers,
            },
          };
        }),

      deletePrinter: (id: string) =>
        set(state => ({
          settings: {
            ...state.settings,
            printers: state.settings.printers.filter(p => p.id !== id),
          },
        })),

      setDefaultPrinter: (id: string) =>
        set(state => ({
          settings: {
            ...state.settings,
            printers: state.settings.printers.map(p => ({
              ...p,
              isDefault: p.id === id,
            })),
          },
        })),

      updateThemeConfig: (config: Partial<ThemeConfig>) =>
        set(state => ({
          settings: {
            ...state.settings,
            themeConfig: { ...state.settings.themeConfig, ...config },
          },
        })),

      updateSecurityConfig: (config: Partial<SecurityConfig>) =>
        set(state => ({
          settings: {
            ...state.settings,
            securityConfig: { ...state.settings.securityConfig, ...config },
          },
        })),

      updateAutoPrintConfig: (config: Partial<AutoPrintConfig>) =>
        set(state => ({
          settings: {
            ...state.settings,
            autoPrintConfig: { ...state.settings.autoPrintConfig, ...config },
          },
        })),

      addNotification: notification =>
        set(state => {
          const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            read: false,
          };

          return {
            notifications: [newNotification, ...state.notifications],
            unreadNotificationCount: state.unreadNotificationCount + 1,
          };
        }),

      markNotificationAsRead: id =>
        set(state => {
          const notification = state.notifications.find(n => n.id === id);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
            unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
          };
        }),

      markAllNotificationsAsRead: () =>
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadNotificationCount: 0,
        })),

      deleteNotification: id =>
        set(state => {
          const notification = state.notifications.find(n => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadNotificationCount: wasUnread
              ? Math.max(0, state.unreadNotificationCount - 1)
              : state.unreadNotificationCount,
          };
        }),

      clearAllNotifications: () =>
        set({
          notifications: [],
          unreadNotificationCount: 0,
        }),

      updateNotificationSettings: settings =>
        set(state => ({
          settings: {
            ...state.settings,
            notificationSettings: { ...state.settings.notificationSettings, ...settings },
          },
        })),

      simulateOnlineOrder: () => {
        const state = get();
        if (!state.settings.notificationSettings?.enabled || !state.settings.notificationSettings?.showOnlineOrders) {
          return;
        }

        const orderNumber = `#${Math.floor(100000 + Math.random() * 900000)}`;
        get().addNotification({
          type: 'order',
          priority: 'high',
          title: 'New Online Order',
          message: `Order ${orderNumber} has been placed. Customer: John Doe`,
          soundEnabled: state.settings.notificationSettings?.soundEnabled,
          autoClose: true,
          duration: state.settings.notificationSettings?.autoCloseDelay,
          metadata: {
            orderNumber,
            customerName: 'John Doe',
            orderType: 'online',
          },
        });
      },

      checkLowStockAlerts: () => {
        const state = get();
        if (!state.settings.notificationSettings?.enabled || !state.settings.notificationSettings?.showLowStock) {
          return;
        }

        const lowStockProducts = state.getLowStockProducts();
        lowStockProducts.forEach(alert => {
          const existingNotification = state.notifications.find(
            n => n.type === 'stock' && n.metadata?.productId === alert.productId && !n.read
          );

          if (!existingNotification) {
            get().addNotification({
              type: 'stock',
              priority: alert.alertType === 'out' ? 'high' : 'medium',
              title: alert.alertType === 'out' ? 'Out of Stock' : 'Low Stock Alert',
              message: `${alert.productName} - Current stock: ${alert.currentStock}`,
              soundEnabled: false,
              autoClose: false,
              metadata: {
                productId: alert.productId,
                currentStock: alert.currentStock,
                minimumStock: alert.minimumStock,
              },
            });
          }
        });
      },

      setTableNumber: (tableNumber, guestsCount) =>
        set(state => ({
          currentOrder: { 
            ...state.currentOrder, 
            tableNumber,
            orderType: tableNumber ? 'dine-in' : state.currentOrder.orderType as any,
            metadata: {
              ...state.currentOrder.metadata,
              guestsCount: guestsCount !== undefined ? guestsCount : state.currentOrder.metadata?.guestsCount,
            }
          },
        })),

      recallUnpaidOrder: orderId => 
        set(state => {
          const unpaidOrder = state.orders.find(o => o.id === orderId);
          if (!unpaidOrder) return state;

          return {
            orders: state.orders.filter(o => o.id !== orderId),
            currentOrder: {
              customerName: unpaidOrder.customerName || '',
              orderType: unpaidOrder.orderType as any,
              items: [...unpaidOrder.items],
              tableNumber: unpaidOrder.tableNumber || '',
              instructions: unpaidOrder.instructions || '',
              metadata: unpaidOrder.metadata || {},
              customerId: unpaidOrder.customerId || '',
              customerPhone: unpaidOrder.metadata?.customerPhone || '',
              loyaltyPoints: unpaidOrder.metadata?.loyaltyPoints || 0,
            },
          };
        }),

      setInstructions: instructions =>
        set(state => ({
          currentOrder: { ...state.currentOrder, instructions },
        })),
      
      fetchTables: async () => {
        try {
          const tables = await invoke<Table[]>('get_tables_command');
          set({ tables });
        } catch (error) {
          console.error('Failed to fetch tables:', error);
        }
      },

      // Implementations for table management
      addTable: async table => {
        const id = `table_${Date.now()}`;
        const newTable: Table = { ...table, id };
        try {
          await invoke('upsert_table_command', { table: newTable });
          get().fetchTables();
        } catch (error) {
          console.error('Failed to add table:', error);
        }
      },

      updateTable: async (id, tableUpdate) => {
        const existingTable = get().tables.find(t => t.id === id);
        if (!existingTable) return;
        
        const updatedTable = { ...existingTable, ...tableUpdate };
        try {
          await invoke('upsert_table_command', { table: updatedTable });
          get().fetchTables();
        } catch (error) {
          console.error('Failed to update table:', error);
        }
      },

      deleteTable: async id => {
        try {
          await invoke('delete_table_command', { id });
          get().fetchTables();
        } catch (error) {
          console.error('Failed to delete table:', error);
        }
      },

      setTableStatus: async (id, status) => {
        const table = get().tables.find(t => t.id === id);
        if (!table) return;
        
        try {
          await invoke('update_table_status_command', { 
            id, 
            status, 
            orderId: table.currentOrderId || null,
            guestsCount: table.guestsCount || null
          });
          get().fetchTables();
        } catch (error) {
          console.error('Failed to set table status:', error);
        }
      },

      assignOrderToTable: async (tableId, orderId, guestsCount) => {
        try {
          await invoke('update_table_status_command', { 
            id: tableId, 
            status: 'occupied', 
            orderId,
            guestsCount: guestsCount || null
          });
          get().fetchTables();
        } catch (error) {
          console.error('Failed to assign order to table:', error);
        }
      },

      clearTableOrder: async tableId => {
        try {
          await invoke('update_table_status_command', { 
            id: tableId, 
            status: 'available', 
            orderId: null,
            guestsCount: null
          });
          get().fetchTables();
        } catch (error) {
          console.error('Failed to clear table order:', error);
        }
      },

      updateKitchenTicketConfig: config =>
        set(state => ({
          settings: {
            ...state.settings,
            kitchenTicketConfig: { ...state.settings.kitchenTicketConfig, ...config },
          },
        })),

      updateCustomerDisplayConfig: config =>
        set(state => ({
          settings: {
            ...state.settings,
            customerDisplayConfig: { ...state.settings.customerDisplayConfig, ...config },
          },
        })),

      // ==========================================
      // HELD ORDERS (Enterprise Hold Sale Feature)
      // ==========================================

      holdCurrentOrder: (reason, priority = 'normal') =>
        set(state => {
          if (state.currentOrder.items.length === 0) return state;

          // Check max held orders limit
          if (state.heldOrders.length >= state.settings.maxHeldOrders) {
            console.warn('Maximum held orders limit reached');
            return state;
          }

          const totalWithTax = state.currentOrder.items.reduce((sum, item) => {
            const itemPrice = item.selectedUnit?.price ?? 0;
            return sum + itemPrice * item.quantity;
          }, 0);

          const taxes = (totalWithTax * state.settings.taxRate) / (100 + state.settings.taxRate);
          const subTotal = totalWithTax - taxes;

          const employee = state.employees.find(e => e.id === state.currentEmployeeId);

          const heldOrder: HeldOrder = {
            id: `held_${Date.now()}`,
            orderNumber: `H-${Math.floor(100000 + Math.random() * 900000)}`,
            customerName: state.currentOrder.customerName || 'Walk-in Customer',
            customerId: state.currentOrder.customerId,
            customerPhone: state.currentOrder.customerPhone,
            loyaltyPoints: state.currentOrder.loyaltyPoints,
            orderType: state.currentOrder.orderType,
            items: [...state.currentOrder.items],
            tableNumber: state.currentOrder.tableNumber,
            instructions: state.currentOrder.instructions,
            metadata: state.currentOrder.metadata,
            heldAt: new Date(),
            heldBy: state.currentEmployeeId || undefined,
            heldByName: employee?.name,
            reason,
            priority,
            expiresAt: state.settings.heldOrderExpiryHours
              ? new Date(Date.now() + state.settings.heldOrderExpiryHours * 60 * 60 * 1000)
              : undefined,
            subTotal,
            estimatedTax: taxes,
            estimatedTotal: totalWithTax,
          };

          return {
            heldOrders: [heldOrder, ...state.heldOrders],
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
          };
        }),

      retrieveHeldOrder: id =>
        set(state => {
          const heldOrder = state.heldOrders.find(o => o.id === id);
          if (!heldOrder) return state;

          // Replace current order with held order
          return {
            heldOrders: state.heldOrders.filter(o => o.id !== id),
            currentOrder: {
              customerName: heldOrder.customerName,
              orderType: heldOrder.orderType,
              items: [...heldOrder.items],
              tableNumber: heldOrder.tableNumber,
              instructions: heldOrder.instructions,
              metadata: heldOrder.metadata,
              customerId: heldOrder.customerId,
              customerPhone: heldOrder.customerPhone,
              loyaltyPoints: heldOrder.loyaltyPoints,
            },
          };
        }),

      deleteHeldOrder: id =>
        set(state => ({
          heldOrders: state.heldOrders.filter(o => o.id !== id),
        })),

      clearAllHeldOrders: () => set({ heldOrders: [] }),

      updateHeldOrderPriority: (id, priority) =>
        set(state => ({
          heldOrders: state.heldOrders.map(o => (o.id === id ? { ...o, priority } : o)),
        })),

      swapUserCart: (fromMemberId, toMemberId) =>
        set(state => {
          if (state.settings.shareCartBetweenUsers) return state;

          const updatedUserCarts = {
            ...state.userCarts,
            [fromMemberId]: { ...state.currentOrder },
          };

          const nextOrder = updatedUserCarts[toMemberId] || {
            customerName: '',
            orderType: 'takeaway',
            items: [],
            tableNumber: '',
            instructions: '',
            metadata: {},
            customerId: '',
            customerPhone: '',
            loyaltyPoints: 0,
          };

          return {
            userCarts: updatedUserCarts,
            currentOrder: nextOrder,
          };
        }),
    }),
    {
      name: 'dealio-pos-storage-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: false,
      partialize: state => ({
        userCarts: state.userCarts,
        currentOrder: state.currentOrder,
        orders: state.orders,
        products: state.products,
        settings: state.settings,
        lastCompletedOrder: state.lastCompletedOrder,
        employees: state.employees,
        cashDrawers: state.cashDrawers,
        currentEmployeeId: state.currentEmployeeId,
        activeCashDrawerId: state.activeCashDrawerId,
        notifications: state.notifications, // Added notifications to persistence
        unreadNotificationCount: state.unreadNotificationCount,
        // Add tables to persistence
        tables: state.tables,
        // Add held orders to persistence (Enterprise)
        heldOrders: state.heldOrders,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('location-changed', (e: Event) => {
    const customEvent = e as CustomEvent;
    const { locationId, products } = customEvent.detail;

    // Update products in store
    usePosStore.getState().setProducts(products);
    usePosStore.getState().setCurrentLocationId(locationId);

    // Re-check low stock alerts for new location
    usePosStore.getState().checkLowStockAlerts();
  });
}
