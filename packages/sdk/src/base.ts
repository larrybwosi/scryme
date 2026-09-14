import { getScrymeV3API } from "./generated/scryme";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type {
  ProductResponseDto,
  ServiceCatalogResponseDto,
  CustomerResponseDto,
  CatalogGetProductsParams,
  CreateProductDto,
  CatalogGetServicesParams,
  UpdateProductDto,
  CreateProductReviewDto,
  UpdateProductReviewDto,
  ProductReviewResponseDto,
  CatalogDeleteReviewParams,
} from "./generated/model";

export type RawAPI = ReturnType<typeof getScrymeV3API>;

/**
 * Represents a customer login session tracked in the backend store.
 */
export interface CustomerSessionDto {
  /**
   * Unique session identifier.
   */
  id: string;
  /**
   * Database identifier of the customer this session belongs to.
   */
  customerId: string;
  /**
   * Active authentication token associated with the session.
   */
  token: string;
  /**
   * User agent of the client device that initiated the session.
   */
  userAgent?: string;
  /**
   * IP address of the client device that initiated the session.
   */
  ipAddress?: string;
  /**
   * ISO string representation of the session expiration timestamp.
   */
  expiresAt: string;
  /**
   * ISO string representation of the session creation timestamp.
   */
  createdAt: string;
  /**
   * ISO string representation of the session last update timestamp.
   */
  updatedAt: string;
}

/**
 * Standard envelope returned upon successful customer registration or login.
 *
 * @template TUser Custom User profile type. Defaults to CustomerResponseDto.
 * @template TSession Custom session tracking type. Defaults to CustomerSessionDto.
 */
export interface CustomerAuthResponseDto<
  TUser = CustomerResponseDto,
  TSession = CustomerSessionDto
> {
  /**
   * Newly-issued local High-Performance Customer JWT bearer token.
   */
  token: string;
  /**
   * Active session details.
   */
  session?: TSession;
  /**
   * Full customer profile and metadata details.
   */
  user?: TUser;
}

export type MethodsWithOrgSlug =
  | "publicServicesListServices"
  | "publicServicesGetCategories"
  | "publicServicesGetService"
  | "publicServicesGetAvailability"
  | "publicServicesRequestOtp"
  | "publicServicesVerifyOtp"
  | "publicServicesCreatePublicBooking"
  | "inventoryVerifyIntegrity"
  | "inventoryFixIntegrity"
  | "inventoryGetInventory"
  | "inventoryTraceBatch"
  | "inventorySplitBatch"
  | "inventoryMergeBatches"
  | "inventoryCreateAssembly"
  | "inventoryCompleteAssembly"
  | "inventoryRequestAdjustment"
  | "inventoryGetAdjustments"
  | "inventoryApproveAdjustment"
  | "inventoryRejectAdjustment"
  | "inventoryGetLeadTime"
  | "inventoryGetWasteAnalysis"
  | "inventoryCheckB2BAvailability"
  | "inventoryUnpackBatch"
  | "inventoryScanUnpackBatch"
  | "inventoryQuickStockInquiry"
  | "accountingInitialize"
  | "accountingGetProfitLoss"
  | "accountingGetBalanceSheet"
  | "accountingGetCashFlow"
  | "accountingGetTaxSummary"
  | "webhooksCreate"
  | "webhooksList"
  | "webhooksDelete"
  | "paymentsCheckout"
  | "catalogGetProducts"
  | "catalogGetProduct"
  | "catalogCreateProduct"
  | "catalogGetServices"
  | "catalogUpdateProduct"
  | "catalogUpdateSupplierVariant"
  | "catalogGetPriceChangeRequests"
  | "catalogReviewPriceChangeRequest"
  | "catalogCreateReview"
  | "catalogUpdateReview"
  | "catalogDeleteReview"
  | "servicesCreateCategory"
  | "servicesGetCategories"
  | "servicesUpdateCategory"
  | "servicesDeleteCategory"
  | "servicesCreateService"
  | "servicesGetServices"
  | "servicesGetCurrentMemberShifts"
  | "servicesGetShifts"
  | "servicesGetService"
  | "servicesUpdateService"
  | "servicesDeleteService"
  | "servicesCreateResource"
  | "servicesGetResources"
  | "servicesUpdateResource"
  | "servicesDeleteResource"
  | "servicesCreateBooking"
  | "servicesGetBookings"
  | "servicesGetBooking"
  | "servicesGetAvailability"
  | "servicesUpdateBookingStatus"
  | "servicesCompleteBooking"
  | "servicesCancelBookingSeries"
  | "servicesCreateShift"
  | "servicesGetStaffShifts"
  | "servicesAddBreak"
  | "servicesRegisterCustomerApp"
  | "servicesGetUtilization"
  | "servicesGetPerformance"
  | "servicesGetFunnel"
  | "customersGetCustomers"
  | "customersRegister"
  | "customersUpdate"
  | "customersGetCustomerById"
  | "customersDelete"
  | "customersGetAddresses"
  | "customersAddAddress"
  | "customersGetCurrentSession"
  | "customersGetSessions"
  | "customersRevokeSession"
  | "customersRevokeAllSessions"
  | "customersRefreshSession"
  | "businessAccountControllerCreate"
  | "businessAccountControllerGetOne"
  | "crmControllerCreateRecord"
  | "crmControllerGetRecord"
  | "crmControllerUpdateRecord"
  | "crmControllerCreateNote"
  | "crmControllerGetRecordNotes"
  | "crmControllerCreateActivity"
  | "crmControllerGetTimeline"
  | "crmControllerCreateObject"
  | "crmControllerListObjects"
  | "crmControllerCreateField"
  | "crmControllerListFields"
  | "crmControllerCreateRelationship"
  | "crmControllerListRelationships"
  | "crmControllerCreateAssociation"
  | "crmControllerListRecordAssociations"
  | "loyaltyRedeemReward"
  | "loyaltyGetCustomerStatus"
  | "loyaltyValidateVoucher"
  | "ordersCreateOrder"
  | "ordersGetOrders"
  | "ordersUpdateStatus"
  | "ordersRequestB2BQuote"
  | "ordersConvertQuoteToOrder"
  | "paymentsControllerHandleStkCallback"
  | "pOSProvision"
  | "pOSLogin"
  | "pOSGetMe"
  | "pOSProcessSale"
  | "pOSSync"
  | "pOSGetTransactions"
  | "pOSRegisterPettyCash"
  | "pOSGetPettyCashFunds"
  | "pOSGetPettyCashTransactions"
  | "membersControllerGetMembers"
  | "membersControllerCreateMember"
  | "membersControllerGetMember"
  | "membersControllerUpdateMember"
  | "membersControllerDeleteMember"
  | "membersControllerGetMemberActivity"
  | "membersControllerUpdateStatus"
  | "membersControllerAdminCheckOut"
  | "invitationsList"
  | "invitationsCreate"
  | "invitationsRevoke"
  | "invitationsAccept"
  | "roleManagementControllerGetCustomRoles"
  | "roleManagementControllerCreateCustomRole"
  | "roleManagementControllerUpdateCustomRole"
  | "roleManagementControllerDeleteCustomRole"
  | "roleManagementControllerGetPermissionSets"
  | "roleManagementControllerCreatePermissionSet"
  | "roleManagementControllerGetRoleGroups"
  | "roleManagementControllerCreateRoleGroup"
  | "roleManagementControllerAssignRoles"
  | "roleManagementControllerRemoveRoles"
  | "departmentsList"
  | "departmentsCreate"
  | "departmentsGet"
  | "departmentsUpdate"
  | "departmentsDelete"
  | "departmentsAddMember"
  | "departmentsRemoveMember"
  | "attendanceControllerGetLogs"
  | "attendanceControllerCheckIn"
  | "attendanceControllerCheckOut"
  | "attendanceControllerGetMyStatus"
  | "attendanceControllerGetStatus"
  | "announcementControllerBroadcastAnnouncement"
  | "cartControllerGetCart"
  | "cartControllerClearCart"
  | "cartControllerAddToCart"
  | "cartControllerRemoveFromCart"
  | "favoritesControllerGetFavorites"
  | "favoritesControllerAddFavorite"
  | "favoritesControllerRemoveFavorite"
  | "stockingGetPurchases"
  | "stockingCreatePurchase"
  | "stockingReceivePurchase"
  | "stockingGetTransfers"
  | "stockingCreateTransfer"
  | "stockingShipTransfer"
  | "stockingReceiveTransfer"
  | "stockingGetRequests"
  | "stockingGetPendingDispatch"
  | "stockingDispatchOrders"
  | "stockingGetActiveDeliveries"
  | "stockingReconcilePod"
  | "stockingGetPhysicalReconciliations"
  | "stockingSubmitPhysicalReconciliation"
  | "stockingGetReconciliationReport"
  | "stockingGetPartners"
  | "stockingCreatePartner"
  | "stockingGetPartner"
  | "stockingUpdatePartner"
  | "stockingAdjustPartnerWallet"
  | "b2BGetCatalog"
  | "b2BGetInvoices"
  | "b2BGetOrders"
  | "b2BCreateOrder"
  | "b2BCreateQuote"
  | "crmIntegrationsGetAuthUrl"
  | "crmIntegrationsHandleCallback"
  | "crmIntegrationsHandleWebhook"
  | "crmIntegrationsReplyToActivity"
  | "unitsGetUnits"
  | "strapiCreateConnection"
  | "strapiListConnections"
  | "strapiGetConnection"
  | "strapiUpdateConnection"
  | "strapiDeleteConnection"
  | "strapiTriggerSync"
  | "strapiEnqueueSync"
  | "strapiGetWebhookLogs"
  | "strapiGetSyncLogs"
  | "strapiExchangeCustomerToken"
  | "strapiRegisterCustomer"
  | "analyticsControllerGetDashboardAnalytics"
  | "analyticsControllerGetResourceUtilization";

export const methodsWithOrgSlugSet = new Set<string>([
  "publicServicesListServices",
  "publicServicesGetCategories",
  "publicServicesGetService",
  "publicServicesGetAvailability",
  "publicServicesRequestOtp",
  "publicServicesVerifyOtp",
  "publicServicesCreatePublicBooking",
  "inventoryVerifyIntegrity",
  "inventoryFixIntegrity",
  "inventoryGetInventory",
  "inventoryTraceBatch",
  "inventorySplitBatch",
  "inventoryMergeBatches",
  "inventoryCreateAssembly",
  "inventoryCompleteAssembly",
  "inventoryRequestAdjustment",
  "inventoryGetAdjustments",
  "inventoryApproveAdjustment",
  "inventoryRejectAdjustment",
  "inventoryGetLeadTime",
  "inventoryGetWasteAnalysis",
  "inventoryCheckB2BAvailability",
  "inventoryUnpackBatch",
  "inventoryScanUnpackBatch",
  "inventoryQuickStockInquiry",
  "accountingInitialize",
  "accountingGetProfitLoss",
  "accountingGetBalanceSheet",
  "accountingGetCashFlow",
  "accountingGetTaxSummary",
  "webhooksCreate",
  "webhooksList",
  "webhooksDelete",
  "paymentsCheckout",
  "catalogGetProducts",
  "catalogGetProduct",
  "catalogCreateProduct",
  "catalogGetServices",
  "catalogUpdateProduct",
  "catalogUpdateSupplierVariant",
  "catalogGetPriceChangeRequests",
  "catalogReviewPriceChangeRequest",
  "catalogCreateReview",
  "catalogUpdateReview",
  "catalogDeleteReview",
  "servicesCreateCategory",
  "servicesGetCategories",
  "servicesUpdateCategory",
  "servicesDeleteCategory",
  "servicesCreateService",
  "servicesGetServices",
  "servicesGetCurrentMemberShifts",
  "servicesGetShifts",
  "servicesGetService",
  "servicesUpdateService",
  "servicesDeleteService",
  "servicesCreateResource",
  "servicesGetResources",
  "servicesUpdateResource",
  "servicesDeleteResource",
  "servicesCreateBooking",
  "servicesGetBookings",
  "servicesGetBooking",
  "servicesGetAvailability",
  "servicesUpdateBookingStatus",
  "servicesCompleteBooking",
  "servicesCancelBookingSeries",
  "servicesCreateShift",
  "servicesGetStaffShifts",
  "servicesAddBreak",
  "servicesRegisterCustomerApp",
  "servicesGetUtilization",
  "servicesGetPerformance",
  "servicesGetFunnel",
  "customersGetCustomers",
  "customersRegister",
  "customersUpdate",
  "customersGetCustomerById",
  "customersDelete",
  "customersGetAddresses",
  "customersAddAddress",
  "customersGetCurrentSession",
  "customersGetSessions",
  "customersRevokeSession",
  "customersRevokeAllSessions",
  "customersRefreshSession",
  "businessAccountControllerCreate",
  "businessAccountControllerGetOne",
  "crmControllerCreateRecord",
  "crmControllerGetRecord",
  "crmControllerUpdateRecord",
  "crmControllerCreateNote",
  "crmControllerGetRecordNotes",
  "crmControllerCreateActivity",
  "crmControllerGetTimeline",
  "crmControllerCreateObject",
  "crmControllerListObjects",
  "crmControllerCreateField",
  "crmControllerListFields",
  "crmControllerCreateRelationship",
  "crmControllerListRelationships",
  "crmControllerCreateAssociation",
  "crmControllerListRecordAssociations",
  "loyaltyRedeemReward",
  "loyaltyGetCustomerStatus",
  "loyaltyValidateVoucher",
  "ordersCreateOrder",
  "ordersGetOrders",
  "ordersUpdateStatus",
  "ordersRequestB2BQuote",
  "ordersConvertQuoteToOrder",
  "paymentsControllerHandleStkCallback",
  "pOSProvision",
  "pOSLogin",
  "pOSGetMe",
  "pOSProcessSale",
  "pOSSync",
  "pOSGetTransactions",
  "pOSRegisterPettyCash",
  "pOSGetPettyCashFunds",
  "pOSGetPettyCashTransactions",
  "membersControllerGetMembers",
  "membersControllerCreateMember",
  "membersControllerGetMember",
  "membersControllerUpdateMember",
  "membersControllerDeleteMember",
  "membersControllerGetMemberActivity",
  "membersControllerUpdateStatus",
  "membersControllerAdminCheckOut",
  "invitationsList",
  "invitationsCreate",
  "invitationsRevoke",
  "invitationsAccept",
  "roleManagementControllerGetCustomRoles",
  "roleManagementControllerCreateCustomRole",
  "roleManagementControllerUpdateCustomRole",
  "roleManagementControllerDeleteCustomRole",
  "roleManagementControllerGetPermissionSets",
  "roleManagementControllerCreatePermissionSet",
  "roleManagementControllerGetRoleGroups",
  "roleManagementControllerCreateRoleGroup",
  "roleManagementControllerAssignRoles",
  "roleManagementControllerRemoveRoles",
  "departmentsList",
  "cartControllerGetCart",
  "cartControllerClearCart",
  "cartControllerAddToCart",
  "cartControllerRemoveFromCart",
  "favoritesControllerGetFavorites",
  "favoritesControllerAddFavorite",
  "favoritesControllerRemoveFavorite"
]);

// Helper type to omit the first argument (orgSlug) of a function if it belongs to MethodsWithOrgSlug
export type OmitOrgSlug<MethodName extends keyof RawAPI, T> = MethodName extends MethodsWithOrgSlug
  ? (T extends (orgSlug: string, ...args: infer A) => infer R ? (...args: A) => R : T)
  : T;

export type SDKModule<Mapping> = {
  [K in keyof Mapping]: Mapping[K] extends keyof RawAPI
    ? OmitOrgSlug<Mapping[K], RawAPI[Mapping[K]]>
    : never;
};

export const catalogMapping = {
  getProducts: "catalogGetProducts",
  getProduct: "catalogGetProduct",
  createProduct: "catalogCreateProduct",
  getServices: "catalogGetServices",
  updateProduct: "catalogUpdateProduct",
  updateSupplierVariant: "catalogUpdateSupplierVariant",
  getPriceChangeRequests: "catalogGetPriceChangeRequests",
  reviewPriceChangeRequest: "catalogReviewPriceChangeRequest",
  createReview: "catalogCreateReview",
  updateReview: "catalogUpdateReview",
  deleteReview: "catalogDeleteReview",
  createServiceCategory: "servicesCreateCategory",
  getServiceCategories: "servicesGetCategories",
  updateServiceCategory: "servicesUpdateCategory",
  deleteServiceCategory: "servicesDeleteCategory",
  createService: "servicesCreateService",
  getServicesList: "servicesGetServices",
  getCurrentMemberShifts: "servicesGetCurrentMemberShifts",
  getShifts: "servicesGetShifts",
  getService: "servicesGetService",
  updateService: "servicesUpdateService",
  deleteService: "servicesDeleteService",
  createResource: "servicesCreateResource",
  getResources: "servicesGetResources",
  updateResource: "servicesUpdateResource",
  deleteResource: "servicesDeleteResource",
  createBooking: "servicesCreateBooking",
  getBookings: "servicesGetBookings",
  getBooking: "servicesGetBooking",
  updateBookingStatus: "servicesUpdateBookingStatus",
  completeBooking: "servicesCompleteBooking",
  createShift: "servicesCreateShift",
  getStaffShifts: "servicesGetStaffShifts",
  addBreak: "servicesAddBreak",
  registerCustomerApp: "servicesRegisterCustomerApp",
  getServiceUtilization: "servicesGetUtilization",
  getServicePerformance: "servicesGetPerformance",
  getServiceFunnel: "servicesGetFunnel",
} as const;

export const authMapping = {
  exchangeToken: "authExchangeToken",
  createOAuthClient: "authCreateOAuthClient",
  listOAuthClients: "authListOAuthClients",
  getOAuthClient: "authGetOAuthClient",
  updateOAuthClient: "authUpdateOAuthClient",
  deleteOAuthClient: "authDeleteOAuthClient",
  handleOAuth2: "authControllerHandleOAuth2",
} as const;

export const inventoryMapping = {
  verifyIntegrity: "inventoryVerifyIntegrity",
  fixIntegrity: "inventoryFixIntegrity",
  getInventory: "inventoryGetInventory",
  traceBatch: "inventoryTraceBatch",
  splitBatch: "inventorySplitBatch",
  mergeBatches: "inventoryMergeBatches",
  createAssembly: "inventoryCreateAssembly",
  completeAssembly: "inventoryCompleteAssembly",
  requestAdjustment: "inventoryRequestAdjustment",
  getAdjustments: "inventoryGetAdjustments",
  approveAdjustment: "inventoryApproveAdjustment",
  rejectAdjustment: "inventoryRejectAdjustment",
  getLeadTime: "inventoryGetLeadTime",
  getWasteAnalysis: "inventoryGetWasteAnalysis",
  checkB2BAvailability: "inventoryCheckB2BAvailability",
  unpackBatch: "inventoryUnpackBatch",
  scanUnpackBatch: "inventoryScanUnpackBatch",
  quickStockInquiry: "inventoryQuickStockInquiry",
  getPurchases: "stockingGetPurchases",
  createPurchase: "stockingCreatePurchase",
  receivePurchase: "stockingReceivePurchase",
  getTransfers: "stockingGetTransfers",
  createTransfer: "stockingCreateTransfer",
  shipTransfer: "stockingShipTransfer",
  receiveTransfer: "stockingReceiveTransfer",
  getRequests: "stockingGetRequests",
  getPendingDispatch: "stockingGetPendingDispatch",
  dispatchOrders: "stockingDispatchOrders",
  getActiveDeliveries: "stockingGetActiveDeliveries",
  reconcilePod: "stockingReconcilePod",
  getPhysicalReconciliations: "stockingGetPhysicalReconciliations",
  submitPhysicalReconciliation: "stockingSubmitPhysicalReconciliation",
  getReconciliationReport: "stockingGetReconciliationReport",
  getPartners: "stockingGetPartners",
  createPartner: "stockingCreatePartner",
  getPartner: "stockingGetPartner",
  updatePartner: "stockingUpdatePartner",
  adjustPartnerWallet: "stockingAdjustPartnerWallet",
  getUnits: "unitsGetUnits",
} as const;

export const ordersMapping = {
  createOrder: "ordersCreateOrder",
  getOrders: "ordersGetOrders",
  updateStatus: "ordersUpdateStatus",
  requestB2BQuote: "ordersRequestB2BQuote",
  convertQuoteToOrder: "ordersConvertQuoteToOrder",
  getB2BCatalog: "b2BGetCatalog",
  getB2BInvoices: "b2BGetInvoices",
  getB2BOrders: "b2BGetOrders",
  createB2BOrder: "b2BCreateOrder",
  createB2BQuote: "b2BCreateQuote",
  getCart: "cartControllerGetCart",
  clearCart: "cartControllerClearCart",
  addToCart: "cartControllerAddToCart",
  removeFromCart: "cartControllerRemoveFromCart",
  checkout: "paymentsCheckout",
  handleStkCallback: "paymentsControllerHandleStkCallback",
} as const;

export const webhooksMapping = {
  create: "webhooksCreate",
  list: "webhooksList",
  delete: "webhooksDelete",
} as const;

export const crmMapping = {
  createRecord: "crmControllerCreateRecord",
  getRecord: "crmControllerGetRecord",
  updateRecord: "crmControllerUpdateRecord",
  createNote: "crmControllerCreateNote",
  getRecordNotes: "crmControllerGetRecordNotes",
  createActivity: "crmControllerCreateActivity",
  getTimeline: "crmControllerGetTimeline",
  createObject: "crmControllerCreateObject",
  listObjects: "crmControllerListObjects",
  createField: "crmControllerCreateField",
  listFields: "crmControllerListFields",
  createRelationship: "crmControllerCreateRelationship",
  listRelationships: "crmControllerListRelationships",
  createAssociation: "crmControllerCreateAssociation",
  listRecordAssociations: "crmControllerListRecordAssociations",
  getIntegrationsAuthUrl: "crmIntegrationsGetAuthUrl",
  handleIntegrationsCallback: "crmIntegrationsHandleCallback",
  handleIntegrationsWebhook: "crmIntegrationsHandleWebhook",
  replyToIntegrationsActivity: "crmIntegrationsReplyToActivity",
  createStrapiConnection: "strapiCreateConnection",
  listStrapiConnections: "strapiListConnections",
  getStrapiConnection: "strapiGetConnection",
  updateStrapiConnection: "strapiUpdateConnection",
  deleteStrapiConnection: "strapiDeleteConnection",
  triggerStrapiSync: "strapiTriggerSync",
  enqueueStrapiSync: "strapiEnqueueSync",
  getStrapiWebhookLogs: "strapiGetWebhookLogs",
  getStrapiSyncLogs: "strapiGetSyncLogs",
  exchangeStrapiCustomerToken: "strapiExchangeCustomerToken",
  registerStrapiCustomer: "strapiRegisterCustomer",
  receiveStrapiWebhook: "strapiReceiveWebhook",
} as const;

export const posMapping = {
  provision: "pOSProvision",
  login: "pOSLogin",
  getMe: "pOSGetMe",
  processSale: "pOSProcessSale",
  sync: "pOSSync",
  getTransactions: "pOSGetTransactions",
  registerPettyCash: "pOSRegisterPettyCash",
  getPettyCashFunds: "pOSGetPettyCashFunds",
  getPettyCashTransactions: "pOSGetPettyCashTransactions",
  createSetupKey: "standalonePosControllerCreateSetupKey",
  activateDevice: "standalonePosControllerActivateDevice",
  validateKey: "standalonePosControllerValidateKey",
  linkOrganization: "standalonePosControllerLinkOrganization",
} as const;

export const accountingMapping = {
  createExpense: "expenseControllerCreateExpense",
  getExpenses: "expenseControllerGetExpenses",
  getExpenseCategories: "expenseControllerGetExpenseCategories",
  getExpense: "expenseControllerGetExpense",
  createPettyCashFund: "pettyCashControllerCreateFund",
  getPettyCashFunds: "pettyCashControllerGetFunds",
  getPettyCashFund: "pettyCashControllerGetFund",
  topUpPettyCashFund: "pettyCashControllerTopUpFund",
  getPettyCashFundTransactions: "pettyCashControllerGetFundTransactions",
  createUtilityAccount: "utilityAccountControllerCreateAccount",
  getUtilityAccounts: "utilityAccountControllerGetAccounts",
  getUtilityAccount: "utilityAccountControllerGetAccount",
  initialize: "accountingInitialize",
  getProfitLoss: "accountingGetProfitLoss",
  getBalanceSheet: "accountingGetBalanceSheet",
  getCashFlow: "accountingGetCashFlow",
  getTaxSummary: "accountingGetTaxSummary",
  createInvoice: "invoiceControllerCreateInvoice",
  getInvoices: "invoiceControllerGetInvoices",
  getInvoice: "invoiceControllerGetInvoice",
  updateInvoice: "invoiceControllerUpdateInvoice",
  deleteInvoice: "invoiceControllerDeleteInvoice",
  finalizeInvoice: "invoiceControllerFinalizeInvoice",
  getTemplates: "invoiceControllerGetTemplates",
  createTemplate: "invoiceControllerCreateTemplate",
  getInvoiceConfig: "invoiceControllerGetConfig",
  updateInvoiceConfig: "invoiceControllerUpdateConfig",
  downloadInvoice: "publicInvoiceControllerDownloadInvoice",
  downloadInvoiceByTransaction: "publicInvoiceControllerDownloadInvoiceByTransaction",
  downloadReceipt: "publicInvoiceControllerDownloadReceipt",
  generatePublicLink: "publicInvoiceControllerGeneratePublicLink",
} as const;

export const loyaltyMapping = {
  redeemReward: "loyaltyRedeemReward",
  getCustomerStatus: "loyaltyGetCustomerStatus",
  validateVoucher: "loyaltyValidateVoucher",
  getFavorites: "favoritesControllerGetFavorites",
  addFavorite: "favoritesControllerAddFavorite",
  removeFavorite: "favoritesControllerRemoveFavorite",
} as const;

export const membersMapping = {
  getMembers: "membersControllerGetMembers",
  createMember: "membersControllerCreateMember",
  getMember: "membersControllerGetMember",
  updateMember: "membersControllerUpdateMember",
  deleteMember: "membersControllerDeleteMember",
  getMemberActivity: "membersControllerGetMemberActivity",
  updateStatus: "membersControllerUpdateStatus",
  adminCheckOut: "membersControllerAdminCheckOut",
  terminalLogin: "terminalMembersControllerLogin",
  listInvitations: "invitationsList",
  createInvitation: "invitationsCreate",
  revokeInvitation: "invitationsRevoke",
  acceptInvitation: "invitationsAccept",
  getCustomRoles: "roleManagementControllerGetCustomRoles",
  createCustomRole: "roleManagementControllerCreateCustomRole",
  updateCustomRole: "roleManagementControllerUpdateCustomRole",
  deleteCustomRole: "roleManagementControllerDeleteCustomRole",
  getPermissionSets: "roleManagementControllerGetPermissionSets",
  createPermissionSet: "roleManagementControllerCreatePermissionSet",
  getRoleGroups: "roleManagementControllerGetRoleGroups",
  createRoleGroup: "roleManagementControllerCreateRoleGroup",
  assignRoles: "roleManagementControllerAssignRoles",
  removeRoles: "roleManagementControllerRemoveRoles",
  listDepartments: "departmentsList",
  createDepartment: "departmentsCreate",
  getDepartment: "departmentsGet",
  updateDepartment: "departmentsUpdate",
  deleteDepartment: "departmentsDelete",
  addDepartmentMember: "departmentsAddMember",
  removeDepartmentMember: "departmentsRemoveMember",
  getAttendanceLogs: "attendanceControllerGetLogs",
  checkIn: "attendanceControllerCheckIn",
  checkOut: "attendanceControllerCheckOut",
  getMyAttendanceStatus: "attendanceControllerGetMyStatus",
  getAttendanceStatus: "attendanceControllerGetStatus",
  broadcastAnnouncement: "announcementControllerBroadcastAnnouncement",
} as const;

export const publicServicesMapping = {
  listServices: "publicServicesListServices",
  getCategories: "publicServicesGetCategories",
  getService: "publicServicesGetService",
  getAvailability: "publicServicesGetAvailability",
  requestOtp: "publicServicesRequestOtp",
  verifyOtp: "publicServicesVerifyOtp",
  createBooking: "publicServicesCreatePublicBooking",
} as const;

export const servicesMapping = {
  ...publicServicesMapping,
  // Admin / Staff scheduling endpoints
  createCategory: "servicesCreateCategory",
  getCategoriesAdmin: "servicesGetCategories",
  updateCategory: "servicesUpdateCategory",
  deleteCategory: "servicesDeleteCategory",
  createService: "servicesCreateService",
  getServicesAdmin: "servicesGetServices",
  getCurrentMemberShifts: "servicesGetCurrentMemberShifts",
  getShifts: "servicesGetShifts",
  getServiceAdmin: "servicesGetService",
  updateService: "servicesUpdateService",
  deleteService: "servicesDeleteService",
  createResource: "servicesCreateResource",
  getResources: "servicesGetResources",
  updateResource: "servicesUpdateResource",
  deleteResource: "servicesDeleteResource",
  createBookingAdmin: "servicesCreateBooking",
  getBookings: "servicesGetBookings",
  getBookingAdmin: "servicesGetBooking",
  getAvailabilityAdmin: "servicesGetAvailability",
  updateBookingStatus: "servicesUpdateBookingStatus",
  completeBooking: "servicesCompleteBooking",
  cancelBookingSeries: "servicesCancelBookingSeries",
  createShift: "servicesCreateShift",
  getStaffShifts: "servicesGetStaffShifts",
  addBreak: "servicesAddBreak",
  registerCustomerApp: "servicesRegisterCustomerApp",
  getServiceUtilization: "servicesGetUtilization",
  getServicePerformance: "servicesGetPerformance",
  getServiceFunnel: "servicesGetFunnel",
} as const;

export const adminMapping = {
  getStats: "adminControllerGetStats",
  listOrganizations: "adminControllerListOrganizations",
  createOrganization: "adminControllerCreateOrganization",
  getOrganizationDetails: "adminControllerGetOrganizationDetails",
  updateOrganization: "adminControllerUpdateOrganization",
  deleteOrganization: "adminControllerDeleteOrganization",
  suspendOrganization: "adminControllerSuspendOrganization",
  reactivateOrganization: "adminControllerReactivateOrganization",
  getEffectiveQuota: "adminControllerGetEffectiveQuota",
  setQuotaOverrides: "adminControllerSetQuotaOverrides",
  listMembers: "adminControllerListMembers",
  listUsers: "adminControllerListUsers",
  banUser: "adminControllerBanUser",
  unbanUser: "adminControllerUnbanUser",
  listConnectedApps: "adminControllerListConnectedApps",
  listSystemLogs: "adminControllerListSystemLogs",
  listGlobalSettings: "adminControllerListGlobalSettings",
  setGlobalSetting: "adminControllerSetGlobalSetting",
  deleteGlobalSetting: "adminControllerDeleteGlobalSetting",
  listTiers: "adminControllerListTiers",
  defineTier: "adminControllerDefineTier",
  deleteTier: "adminControllerDeleteTier",
  getOrganizationSubscription: "adminControllerGetOrganizationSubscription",
  updateOrganizationSubscription: "adminControllerUpdateOrganizationSubscription",
  listSystemPayments: "adminControllerListSystemPayments",
  recordCustomPayment: "adminControllerRecordCustomPayment",
  listIntegrationDefinitions: "adminControllerListIntegrationDefinitions",
  createIntegrationDefinition: "adminControllerCreateIntegrationDefinition",
  updateIntegrationDefinition: "adminControllerUpdateIntegrationDefinition",
  deleteIntegrationDefinition: "adminControllerDeleteIntegrationDefinition",
  listActiveOrganizationIntegrations: "adminControllerListActiveOrganizationIntegrations",
  createWebhook: "webhooksCreate",
  listWebhooks: "webhooksList",
  deleteWebhook: "webhooksDelete",
  getCustomers: "customersGetCustomers",
  registerCustomer: "customersRegister",
  updateCustomer: "customersUpdate",
  getCustomerById: "customersGetCustomerById",
  deleteCustomer: "customersDelete",
  getCustomerAddresses: "customersGetAddresses",
  addCustomerAddress: "customersAddAddress",
  createBusinessAccount: "businessAccountControllerCreate",
  getBusinessAccount: "businessAccountControllerGetOne",
  getDashboardAnalytics: "analyticsControllerGetDashboardAnalytics",
  getResourceUtilization: "analyticsControllerGetResourceUtilization",
} as const;

export interface CatalogModule<
  TProduct = ProductResponseDto,
  TService = ServiceCatalogResponseDto
> extends Omit<SDKModule<typeof catalogMapping>, "getProducts" | "createProduct" | "getServices" | "updateProduct" | "getProduct" | "getService" | "createReview" | "updateReview" | "deleteReview"> {
  getProducts<T = TProduct>(params?: CatalogGetProductsParams, options?: AxiosRequestConfig): Promise<AxiosResponse<T[]>>;
  createProduct<T = TProduct>(createProductDto: CreateProductDto, options?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  getServices<T = TService>(params?: CatalogGetServicesParams, options?: AxiosRequestConfig): Promise<AxiosResponse<T[]>>;
  updateProduct<T = TProduct>(id: string, updateProductDto: UpdateProductDto, options?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  getProduct<T = TProduct>(idOrSlug: string | { id?: string; slug?: string }, options?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  getService<T = TService>(idOrSlug: string | { id?: string; slug?: string }, options?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  createReview(productId: string, createProductReviewDto: CreateProductReviewDto, options?: AxiosRequestConfig): Promise<AxiosResponse<ProductReviewResponseDto>>;
  updateReview(reviewId: string, updateProductReviewDto: UpdateProductReviewDto, options?: AxiosRequestConfig): Promise<AxiosResponse<ProductReviewResponseDto>>;
  deleteReview(reviewId: string, params?: CatalogDeleteReviewParams, options?: AxiosRequestConfig): Promise<AxiosResponse<void>>;
}

export type AuthModule = SDKModule<typeof authMapping>;
export type InventoryModule = SDKModule<typeof inventoryMapping>;
export type OrdersModule = SDKModule<typeof ordersMapping>;
export type CRMModule = SDKModule<typeof crmMapping>;
export type POSModule = SDKModule<typeof posMapping>;
export type AccountingModule = SDKModule<typeof accountingMapping>;
export type LoyaltyModule = SDKModule<typeof loyaltyMapping>;
export type MembersModule = SDKModule<typeof membersMapping>;
export type WebhooksModule = SDKModule<typeof webhooksMapping>;
export type AdminModule = SDKModule<typeof adminMapping>;

export type PublicServicesModule = SDKModule<typeof publicServicesMapping>;
export type ServicesModule = SDKModule<typeof servicesMapping>;

export function buildModule<Mapping extends Record<string, keyof RawAPI>>(
  api: RawAPI,
  orgSlug: string,
  mapping: Mapping
): SDKModule<Mapping> {
  const result: any = {};
  for (const [key, rawMethodName] of Object.entries(mapping)) {
    const rawFn = api[rawMethodName];
    if (typeof rawFn === "function") {
      if (methodsWithOrgSlugSet.has(rawMethodName)) {
        result[key] = function(this: any, ...args: any[]) {
          return (rawFn as any).apply(this, [orgSlug, ...args]);
        };
      } else {
        result[key] = function(this: any, ...args: any[]) {
          return (rawFn as any).apply(this, args);
        };
      }
    }
  }
  return result as SDKModule<Mapping>;
}

export function getJwtExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let payloadStr = "";
    if (typeof Buffer !== "undefined") {
      payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
    } else if (typeof window !== "undefined" && typeof window.atob === "function") {
      payloadStr = window.atob(parts[1]);
    } else {
      payloadStr = atob(parts[1]);
    }
    const payload = JSON.parse(payloadStr);
    if (payload && typeof payload.exp === "number") {
      return payload.exp * 1000; // convert to ms
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}
