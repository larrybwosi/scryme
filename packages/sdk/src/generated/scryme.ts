











/**
 * @summary Get dashboard analytics
 */
const analyticsControllerGetDashboardAnalytics = (
    orgSlug: string, options?: AxiosRequestConfig
 ): Promise<AxiosResponse<void>> => {
    return axiosInstance.get(
      `/v3/${orgSlug}/analytics/dashboard`,options
    );
  }

/**
 * @summary Get resource utilization
 */
const analyticsControllerGetResourceUtilization = (
    orgSlug: string,
    params: AnalyticsControllerGetResourceUtilizationParams, options?: AxiosRequestConfig
 ): Promise<AxiosResponse<void>> => {
    return axiosInstance.get(
      `/v3/${orgSlug}/analytics/utilization`,{
    ...options,
        params: {...params, ...options?.params},}
    );
  }

return {servicesCreateCategory,servicesGetCategories,servicesUpdateCategory,servicesDeleteCategory,servicesCreateService,servicesGetServices,servicesGetCurrentMemberShifts,servicesGetShifts,servicesGetService,servicesUpdateService,servicesGetAvailability,servicesDeleteService,servicesCreateResource,servicesGetResources,servicesUpdateResource,servicesDeleteResource,servicesCreateBooking,servicesGetBookings,servicesGetBooking,servicesUpdateBookingStatus,servicesCompleteBooking,servicesCancelBookingSeries,servicesCreateShift,servicesGetStaffShifts,servicesAddBreak,servicesRegisterCustomerApp,servicesGetUtilization,servicesGetPerformance,servicesGetFunnel,publicServicesListServices,publicServicesGetCategories,publicServicesGetService,publicServicesGetAvailability,publicServicesRequestOtp,publicServicesVerifyOtp,publicServicesCreatePublicBooking,inventoryVerifyIntegrity,inventoryFixIntegrity,inventoryGetInventory,inventoryTraceBatch,inventorySplitBatch,inventoryMergeBatches,inventoryCreateAssembly,inventoryCompleteAssembly,inventoryRequestAdjustment,inventoryGetAdjustments,inventoryApproveAdjustment,inventoryRejectAdjustment,inventoryGetLeadTime,inventoryGetWasteAnalysis,inventoryCheckB2BAvailability,inventoryUnpackBatch,inventoryScanUnpackBatch,inventoryQuickStockInquiry,expenseControllerCreateExpense,expenseControllerGetExpenses,expenseControllerGetExpenseCategories,expenseControllerGetExpense,pettyCashControllerCreateFund,pettyCashControllerGetFunds,pettyCashControllerGetFund,pettyCashControllerTopUpFund,pettyCashControllerGetFundTransactions,utilityAccountControllerCreateAccount,utilityAccountControllerGetAccounts,utilityAccountControllerGetAccount,accountingInitialize,accountingGetProfitLoss,accountingGetBalanceSheet,accountingGetCashFlow,accountingGetTaxSummary,invoiceControllerCreateInvoice,invoiceControllerGetInvoices,invoiceControllerGetInvoice,invoiceControllerUpdateInvoice,invoiceControllerDeleteInvoice,invoiceControllerFinalizeInvoice,invoiceControllerGetTemplates,invoiceControllerCreateTemplate,invoiceControllerGetConfig,invoiceControllerUpdateConfig,publicInvoiceControllerDownloadInvoice,publicInvoiceControllerDownloadInvoiceByTransaction,publicInvoiceControllerDownloadReceipt,publicInvoiceControllerGeneratePublicLink,authExchangeToken,authCreateOAuthClient,authListOAuthClients,authGetOAuthClient,authUpdateOAuthClient,authDeleteOAuthClient,authControllerHandleOAuth2,adminControllerGetStats,adminControllerListOrganizations,adminControllerCreateOrganization,adminControllerGetOrganizationDetails,adminControllerUpdateOrganization,adminControllerDeleteOrganization,adminControllerSuspendOrganization,adminControllerReactivateOrganization,adminControllerGetEffectiveQuota,adminControllerSetQuotaOverrides,adminControllerListMembers,adminControllerListUsers,adminControllerBanUser,adminControllerUnbanUser,adminControllerListConnectedApps,adminControllerListSystemLogs,adminControllerListGlobalSettings,adminControllerSetGlobalSetting,adminControllerDeleteGlobalSetting,adminControllerListTiers,adminControllerDefineTier,adminControllerDeleteTier,adminControllerGetOrganizationSubscription,adminControllerUpdateOrganizationSubscription,adminControllerListSystemPayments,adminControllerRecordCustomPayment,adminControllerListIntegrationDefinitions,adminControllerCreateIntegrationDefinition,adminControllerUpdateIntegrationDefinition,adminControllerDeleteIntegrationDefinition,adminControllerListActiveOrganizationIntegrations,webhooksCreate,webhooksList,webhooksDelete,catalogGetProducts,catalogCreateProduct,catalogGetProduct,catalogGetServices,catalogUpdateProduct,catalogUpdateSupplierVariant,catalogGetPriceChangeRequests,catalogReviewPriceChangeRequest,catalogCreateReview,catalogUpdateReview,catalogDeleteReview,customersGetCustomers,customersRegister,customerRegister,customersLogin,customersRefreshSession,customersGetCurrentSession,customersGetSessions,customersRevokeAllSessions,customersRevokeSession,customersUpdate,customersGetCustomerById,customersDelete,customersGetAddresses,customersAddAddress,businessAccountControllerCreate,businessAccountControllerGetOne,crmControllerCreateRecord,crmControllerGetRecord,crmControllerUpdateRecord,crmControllerCreateNote,crmControllerGetRecordNotes,crmControllerCreateActivity,crmControllerGetTimeline,crmControllerCreateObject,crmControllerListObjects,crmControllerCreateField,crmControllerListFields,crmControllerCreateRelationship,crmControllerListRelationships,crmControllerCreateAssociation,crmControllerListRecordAssociations,loyaltyRedeemReward,loyaltyGetCustomerStatus,loyaltyValidateVoucher,ordersCreateOrder,ordersGetOrders,ordersUpdateStatus,ordersRequestB2BQuote,ordersConvertQuoteToOrder,paymentsCheckout,paymentsControllerHandleStkCallback,pOSProvision,pOSLogin,pOSGetMe,pOSProcessSale,pOSSync,pOSGetTransactions,pOSRegisterPettyCash,pOSGetPettyCashFunds,pOSGetPettyCashTransactions,pOSCreatePairingSession,pOSGetPairingSessionStatus,pOSAuthorizePairingSession,membersControllerGetMembers,membersControllerCreateMember,membersControllerGetMember,membersControllerUpdateMember,membersControllerDeleteMember,membersControllerGetMemberActivity,membersControllerUpdateStatus,membersControllerAdminCheckOut,terminalMembersControllerLogin,invitationsList,invitationsCreate,invitationsRevoke,invitationsAccept,roleManagementControllerGetCustomRoles,roleManagementControllerCreateCustomRole,roleManagementControllerUpdateCustomRole,roleManagementControllerDeleteCustomRole,roleManagementControllerGetPermissionSets,roleManagementControllerCreatePermissionSet,roleManagementControllerGetRoleGroups,roleManagementControllerCreateRoleGroup,roleManagementControllerAssignRoles,roleManagementControllerRemoveRoles,departmentsList,departmentsCreate,departmentsGet,departmentsUpdate,departmentsDelete,departmentsAddMember,departmentsRemoveMember,attendanceControllerGetLogs,attendanceControllerCheckIn,attendanceControllerCheckOut,attendanceControllerGetMyStatus,attendanceControllerGetStatus,announcementControllerBroadcastAnnouncement,cartControllerGetCart,cartControllerClearCart,cartControllerAddToCart,cartControllerRemoveFromCart,favoritesControllerGetFavorites,favoritesControllerAddFavorite,favoritesControllerRemoveFavorite,stockingGetPurchases,stockingCreatePurchase,stockingReceivePurchase,stockingGetTransfers,stockingCreateTransfer,stockingShipTransfer,stockingReceiveTransfer,stockingGetRequests,stockingGetPendingDispatch,stockingDispatchOrders,stockingGetActiveDeliveries,stockingReconcilePod,stockingGetPhysicalReconciliations,stockingSubmitPhysicalReconciliation,stockingGetReconciliationReport,stockingGetPartners,stockingCreatePartner,stockingGetPartner,stockingUpdatePartner,stockingAdjustPartnerWallet,standalonePosControllerCreateSetupKey,standalonePosControllerActivateDevice,standalonePosControllerValidateKey,standalonePosControllerLinkOrganization,b2BGetCatalog,b2BGetInvoices,b2BGetOrders,b2BCreateOrder,b2BCreateQuote,crmIntegrationsGetAuthUrl,crmIntegrationsHandleCallback,crmIntegrationsHandleWebhook,crmIntegrationsReplyToActivity,unitsGetUnits,analyticsControllerGetDashboardAnalytics,analyticsControllerGetResourceUtilization};
export type ServicesCreateCategoryResult = AxiosResponse<void>
export type ServicesGetCategoriesResult = AxiosResponse<void>
export type ServicesUpdateCategoryResult = AxiosResponse<void>
export type ServicesDeleteCategoryResult = AxiosResponse<void>
export type ServicesCreateServiceResult = AxiosResponse<void>
export type ServicesGetServicesResult = AxiosResponse<void>
export type ServicesGetCurrentMemberShiftsResult = AxiosResponse<void>
export type ServicesGetShiftsResult = AxiosResponse<void>
export type ServicesGetServiceResult = AxiosResponse<void>
export type ServicesUpdateServiceResult = AxiosResponse<void>
export type ServicesGetAvailabilityResult = AxiosResponse<void>
export type ServicesDeleteServiceResult = AxiosResponse<void>
export type ServicesCreateResourceResult = AxiosResponse<void>
export type ServicesGetResourcesResult = AxiosResponse<void>
export type ServicesUpdateResourceResult = AxiosResponse<void>
export type ServicesDeleteResourceResult = AxiosResponse<void>
export type ServicesCreateBookingResult = AxiosResponse<void>
export type ServicesGetBookingsResult = AxiosResponse<void>
export type ServicesGetBookingResult = AxiosResponse<void>
export type ServicesUpdateBookingStatusResult = AxiosResponse<void>
export type ServicesCompleteBookingResult = AxiosResponse<void>
export type ServicesCancelBookingSeriesResult = AxiosResponse<void>
export type ServicesCreateShiftResult = AxiosResponse<void>
export type ServicesGetStaffShiftsResult = AxiosResponse<void>
export type ServicesAddBreakResult = AxiosResponse<void>
export type ServicesRegisterCustomerAppResult = AxiosResponse<void>
export type ServicesGetUtilizationResult = AxiosResponse<void>
export type ServicesGetPerformanceResult = AxiosResponse<void>
export type ServicesGetFunnelResult = AxiosResponse<void>
export type PublicServicesListServicesResult = AxiosResponse<void>
export type PublicServicesGetCategoriesResult = AxiosResponse<void>
export type PublicServicesGetServiceResult = AxiosResponse<void>
export type PublicServicesGetAvailabilityResult = AxiosResponse<void>
export type PublicServicesRequestOtpResult = AxiosResponse<void>
export type PublicServicesVerifyOtpResult = AxiosResponse<void>
export type PublicServicesCreatePublicBookingResult = AxiosResponse<void>
export type InventoryVerifyIntegrityResult = AxiosResponse<void>
export type InventoryFixIntegrityResult = AxiosResponse<void>
export type InventoryGetInventoryResult = AxiosResponse<InventoryResponseDto[]>
export type InventoryTraceBatchResult = AxiosResponse<void>
export type InventorySplitBatchResult = AxiosResponse<void>
export type InventoryMergeBatchesResult = AxiosResponse<void>
export type InventoryCreateAssemblyResult = AxiosResponse<void>
export type InventoryCompleteAssemblyResult = AxiosResponse<void>
export type InventoryRequestAdjustmentResult = AxiosResponse<void>
export type InventoryGetAdjustmentsResult = AxiosResponse<void>
export type InventoryApproveAdjustmentResult = AxiosResponse<void>
export type InventoryRejectAdjustmentResult = AxiosResponse<void>
export type InventoryGetLeadTimeResult = AxiosResponse<void>
export type InventoryGetWasteAnalysisResult = AxiosResponse<void>
export type InventoryCheckB2BAvailabilityResult = AxiosResponse<void>
export type InventoryUnpackBatchResult = AxiosResponse<void>
export type InventoryScanUnpackBatchResult = AxiosResponse<void>
export type InventoryQuickStockInquiryResult = AxiosResponse<void>
export type ExpenseControllerCreateExpenseResult = AxiosResponse<void>
export type ExpenseControllerGetExpensesResult = AxiosResponse<void>
export type ExpenseControllerGetExpenseCategoriesResult = AxiosResponse<void>
export type ExpenseControllerGetExpenseResult = AxiosResponse<void>
export type PettyCashControllerCreateFundResult = AxiosResponse<void>
export type PettyCashControllerGetFundsResult = AxiosResponse<void>
export type PettyCashControllerGetFundResult = AxiosResponse<void>
export type PettyCashControllerTopUpFundResult = AxiosResponse<void>
export type PettyCashControllerGetFundTransactionsResult = AxiosResponse<void>
export type UtilityAccountControllerCreateAccountResult = AxiosResponse<void>
export type UtilityAccountControllerGetAccountsResult = AxiosResponse<void>
export type UtilityAccountControllerGetAccountResult = AxiosResponse<void>
export type AccountingInitializeResult = AxiosResponse<void>
export type AccountingGetProfitLossResult = AxiosResponse<void>
export type AccountingGetBalanceSheetResult = AxiosResponse<void>
export type AccountingGetCashFlowResult = AxiosResponse<void>
export type AccountingGetTaxSummaryResult = AxiosResponse<void>
export type InvoiceControllerCreateInvoiceResult = AxiosResponse<void>
export type InvoiceControllerGetInvoicesResult = AxiosResponse<void>
export type InvoiceControllerGetInvoiceResult = AxiosResponse<void>
export type InvoiceControllerUpdateInvoiceResult = AxiosResponse<void>
export type InvoiceControllerDeleteInvoiceResult = AxiosResponse<void>
export type InvoiceControllerFinalizeInvoiceResult = AxiosResponse<void>
export type InvoiceControllerGetTemplatesResult = AxiosResponse<void>
export type InvoiceControllerCreateTemplateResult = AxiosResponse<void>
export type InvoiceControllerGetConfigResult = AxiosResponse<void>
export type InvoiceControllerUpdateConfigResult = AxiosResponse<void>
export type PublicInvoiceControllerDownloadInvoiceResult = AxiosResponse<void>
export type PublicInvoiceControllerDownloadInvoiceByTransactionResult = AxiosResponse<void>
export type PublicInvoiceControllerDownloadReceiptResult = AxiosResponse<void>
export type PublicInvoiceControllerGeneratePublicLinkResult = AxiosResponse<void>
export type AuthExchangeTokenResult = AxiosResponse<AuthExchangeToken201>
export type AuthCreateOAuthClientResult = AxiosResponse<AuthCreateOAuthClient201>
export type AuthListOAuthClientsResult = AxiosResponse<void>
export type AuthGetOAuthClientResult = AxiosResponse<void>
export type AuthUpdateOAuthClientResult = AxiosResponse<void>
export type AuthDeleteOAuthClientResult = AxiosResponse<void>
export type AuthControllerHandleOAuth2Result = AxiosResponse<void>
export type AdminControllerGetStatsResult = AxiosResponse<void>
export type AdminControllerListOrganizationsResult = AxiosResponse<void>
export type AdminControllerCreateOrganizationResult = AxiosResponse<void>
export type AdminControllerGetOrganizationDetailsResult = AxiosResponse<void>
export type AdminControllerUpdateOrganizationResult = AxiosResponse<void>
export type AdminControllerDeleteOrganizationResult = AxiosResponse<void>
export type AdminControllerSuspendOrganizationResult = AxiosResponse<void>
export type AdminControllerReactivateOrganizationResult = AxiosResponse<void>
export type AdminControllerGetEffectiveQuotaResult = AxiosResponse<void>
export type AdminControllerSetQuotaOverridesResult = AxiosResponse<void>
export type AdminControllerListMembersResult = AxiosResponse<void>
export type AdminControllerListUsersResult = AxiosResponse<void>
export type AdminControllerBanUserResult = AxiosResponse<void>
export type AdminControllerUnbanUserResult = AxiosResponse<void>
export type AdminControllerListConnectedAppsResult = AxiosResponse<void>
export type AdminControllerListSystemLogsResult = AxiosResponse<void>
export type AdminControllerListGlobalSettingsResult = AxiosResponse<void>
export type AdminControllerSetGlobalSettingResult = AxiosResponse<void>
export type AdminControllerDeleteGlobalSettingResult = AxiosResponse<void>
export type AdminControllerListTiersResult = AxiosResponse<void>
export type AdminControllerDefineTierResult = AxiosResponse<void>
export type AdminControllerDeleteTierResult = AxiosResponse<void>
export type AdminControllerGetOrganizationSubscriptionResult = AxiosResponse<void>
export type AdminControllerUpdateOrganizationSubscriptionResult = AxiosResponse<void>
export type AdminControllerListSystemPaymentsResult = AxiosResponse<void>
export type AdminControllerRecordCustomPaymentResult = AxiosResponse<void>
export type AdminControllerListIntegrationDefinitionsResult = AxiosResponse<void>
export type AdminControllerCreateIntegrationDefinitionResult = AxiosResponse<void>
export type AdminControllerUpdateIntegrationDefinitionResult = AxiosResponse<void>
export type AdminControllerDeleteIntegrationDefinitionResult = AxiosResponse<void>
export type AdminControllerListActiveOrganizationIntegrationsResult = AxiosResponse<void>
export type WebhooksCreateResult = AxiosResponse<WebhookResponseDto>
export type WebhooksListResult = AxiosResponse<WebhookResponseDto[]>
export type WebhooksDeleteResult = AxiosResponse<void>
export type CatalogGetProductsResult = AxiosResponse<ProductResponseDto[]>
export type CatalogCreateProductResult = AxiosResponse<ProductResponseDto>
export type CatalogGetProductResult = AxiosResponse<ProductResponseDto>
export type CatalogGetServicesResult = AxiosResponse<ServiceCatalogResponseDto[]>
export type CatalogUpdateProductResult = AxiosResponse<ProductResponseDto>
export type CatalogUpdateSupplierVariantResult = AxiosResponse<void>
export type CatalogGetPriceChangeRequestsResult = AxiosResponse<void>
export type CatalogReviewPriceChangeRequestResult = AxiosResponse<void>
export type CatalogCreateReviewResult = AxiosResponse<ProductReviewResponseDto>
export type CatalogUpdateReviewResult = AxiosResponse<ProductReviewResponseDto>
export type CatalogDeleteReviewResult = AxiosResponse<void>
export type CustomersGetCustomersResult = AxiosResponse<CustomerResponseDto[]>
export type CustomersRegisterResult = AxiosResponse<CustomerResponseDto>
export type CustomerRegisterResult = AxiosResponse<CustomerResponseDto>
export type CustomersLoginResult = AxiosResponse<void>
export type CustomersRefreshSessionResult = AxiosResponse<void>
export type CustomersGetCurrentSessionResult = AxiosResponse<void>
export type CustomersGetSessionsResult = AxiosResponse<void>
export type CustomersRevokeAllSessionsResult = AxiosResponse<void>
export type CustomersRevokeSessionResult = AxiosResponse<void>
export type CustomersUpdateResult = AxiosResponse<CustomerResponseDto>
export type CustomersGetCustomerByIdResult = AxiosResponse<CustomerResponseDto>
export type CustomersDeleteResult = AxiosResponse<void>
export type CustomersGetAddressesResult = AxiosResponse<void>
export type CustomersAddAddressResult = AxiosResponse<void>
export type BusinessAccountControllerCreateResult = AxiosResponse<void>
export type BusinessAccountControllerGetOneResult = AxiosResponse<void>
export type CrmControllerCreateRecordResult = AxiosResponse<CrmRecordResponseDto>
export type CrmControllerGetRecordResult = AxiosResponse<CrmRecordResponseDto>
export type CrmControllerUpdateRecordResult = AxiosResponse<CrmRecordResponseDto>
export type CrmControllerCreateNoteResult = AxiosResponse<CrmNoteResponseDto>
export type CrmControllerGetRecordNotesResult = AxiosResponse<CrmNoteResponseDto[]>
export type CrmControllerCreateActivityResult = AxiosResponse<void>
export type CrmControllerGetTimelineResult = AxiosResponse<void>
export type CrmControllerCreateObjectResult = AxiosResponse<void>
export type CrmControllerListObjectsResult = AxiosResponse<void>
export type CrmControllerCreateFieldResult = AxiosResponse<void>
export type CrmControllerListFieldsResult = AxiosResponse<void>
export type CrmControllerCreateRelationshipResult = AxiosResponse<void>
export type CrmControllerListRelationshipsResult = AxiosResponse<void>
export type CrmControllerCreateAssociationResult = AxiosResponse<void>
export type CrmControllerListRecordAssociationsResult = AxiosResponse<void>
export type LoyaltyRedeemRewardResult = AxiosResponse<void>
export type LoyaltyGetCustomerStatusResult = AxiosResponse<LoyaltyStatusResponseDto>
export type LoyaltyValidateVoucherResult = AxiosResponse<void>
export type OrdersCreateOrderResult = AxiosResponse<OrderResponseDto>
export type OrdersGetOrdersResult = AxiosResponse<OrderResponseDto[]>
export type OrdersUpdateStatusResult = AxiosResponse<OrderResponseDto>
export type OrdersRequestB2BQuoteResult = AxiosResponse<void>
export type OrdersConvertQuoteToOrderResult = AxiosResponse<void>
export type PaymentsCheckoutResult = AxiosResponse<CheckoutResponseDto>
export type PaymentsControllerHandleStkCallbackResult = AxiosResponse<void>
export type POSProvisionResult = AxiosResponse<ProvisionResponseDto>
export type POSLoginResult = AxiosResponse<PosLoginResponseDto>
export type POSGetMeResult = AxiosResponse<void>
export type POSProcessSaleResult = AxiosResponse<void>
export type POSSyncResult = AxiosResponse<void>
export type POSGetTransactionsResult = AxiosResponse<void>
export type POSRegisterPettyCashResult = AxiosResponse<void>
export type POSGetPettyCashFundsResult = AxiosResponse<void>
export type POSGetPettyCashTransactionsResult = AxiosResponse<void>
export type POSCreatePairingSessionResult = AxiosResponse<void>
export type POSGetPairingSessionStatusResult = AxiosResponse<void>
export type POSAuthorizePairingSessionResult = AxiosResponse<void>
export type MembersControllerGetMembersResult = AxiosResponse<MemberResponseDto[]>
export type MembersControllerCreateMemberResult = AxiosResponse<MemberResponseDto>
export type MembersControllerGetMemberResult = AxiosResponse<MemberResponseDto>
export type MembersControllerUpdateMemberResult = AxiosResponse<MemberResponseDto>
export type MembersControllerDeleteMemberResult = AxiosResponse<void>
export type MembersControllerGetMemberActivityResult = AxiosResponse<void>
export type MembersControllerUpdateStatusResult = AxiosResponse<void>
export type MembersControllerAdminCheckOutResult = AxiosResponse<void>
export type TerminalMembersControllerLoginResult = AxiosResponse<TerminalLoginResponseDto>
export type InvitationsListResult = AxiosResponse<InvitationResponseDto[]>
export type InvitationsCreateResult = AxiosResponse<InvitationResponseDto>
export type InvitationsRevokeResult = AxiosResponse<void>
export type InvitationsAcceptResult = AxiosResponse<void>
export type RoleManagementControllerGetCustomRolesResult = AxiosResponse<void>
export type RoleManagementControllerCreateCustomRoleResult = AxiosResponse<void>
export type RoleManagementControllerUpdateCustomRoleResult = AxiosResponse<void>
export type RoleManagementControllerDeleteCustomRoleResult = AxiosResponse<void>
export type RoleManagementControllerGetPermissionSetsResult = AxiosResponse<void>
export type RoleManagementControllerCreatePermissionSetResult = AxiosResponse<void>
export type RoleManagementControllerGetRoleGroupsResult = AxiosResponse<void>
export type RoleManagementControllerCreateRoleGroupResult = AxiosResponse<void>
export type RoleManagementControllerAssignRolesResult = AxiosResponse<void>
export type RoleManagementControllerRemoveRolesResult = AxiosResponse<void>
export type DepartmentsListResult = AxiosResponse<DepartmentResponseDto[]>
export type DepartmentsCreateResult = AxiosResponse<DepartmentResponseDto>
export type DepartmentsGetResult = AxiosResponse<DepartmentResponseDto>
export type DepartmentsUpdateResult = AxiosResponse<DepartmentResponseDto>
export type DepartmentsDeleteResult = AxiosResponse<void>
export type DepartmentsAddMemberResult = AxiosResponse<void>
export type DepartmentsRemoveMemberResult = AxiosResponse<void>
export type AttendanceControllerGetLogsResult = AxiosResponse<void>
export type AttendanceControllerCheckInResult = AxiosResponse<void>
export type AttendanceControllerCheckOutResult = AxiosResponse<void>
export type AttendanceControllerGetMyStatusResult = AxiosResponse<void>
export type AttendanceControllerGetStatusResult = AxiosResponse<void>
export type AnnouncementControllerBroadcastAnnouncementResult = AxiosResponse<void>
export type CartControllerGetCartResult = AxiosResponse<CartResponseDto>
export type CartControllerClearCartResult = AxiosResponse<void>
export type CartControllerAddToCartResult = AxiosResponse<void>
export type CartControllerRemoveFromCartResult = AxiosResponse<void>
export type FavoritesControllerGetFavoritesResult = AxiosResponse<FavoriteResponseDto[]>
export type FavoritesControllerAddFavoriteResult = AxiosResponse<void>
export type FavoritesControllerRemoveFavoriteResult = AxiosResponse<void>
export type StockingGetPurchasesResult = AxiosResponse<void>
export type StockingCreatePurchaseResult = AxiosResponse<void>
export type StockingReceivePurchaseResult = AxiosResponse<void>
export type StockingGetTransfersResult = AxiosResponse<void>
export type StockingCreateTransferResult = AxiosResponse<void>
export type StockingShipTransferResult = AxiosResponse<void>
export type StockingReceiveTransferResult = AxiosResponse<void>
export type StockingGetRequestsResult = AxiosResponse<void>
export type StockingGetPendingDispatchResult = AxiosResponse<void>
export type StockingDispatchOrdersResult = AxiosResponse<void>
export type StockingGetActiveDeliveriesResult = AxiosResponse<void>
export type StockingReconcilePodResult = AxiosResponse<void>
export type StockingGetPhysicalReconciliationsResult = AxiosResponse<void>
export type StockingSubmitPhysicalReconciliationResult = AxiosResponse<void>
export type StockingGetReconciliationReportResult = AxiosResponse<void>
export type StockingGetPartnersResult = AxiosResponse<void>
export type StockingCreatePartnerResult = AxiosResponse<void>
export type StockingGetPartnerResult = AxiosResponse<void>
export type StockingUpdatePartnerResult = AxiosResponse<void>
export type StockingAdjustPartnerWalletResult = AxiosResponse<void>
export type StandalonePosControllerCreateSetupKeyResult = AxiosResponse<void>
export type StandalonePosControllerActivateDeviceResult = AxiosResponse<void>
export type StandalonePosControllerValidateKeyResult = AxiosResponse<void>
export type StandalonePosControllerLinkOrganizationResult = AxiosResponse<void>
export type B2BGetCatalogResult = AxiosResponse<PaginatedB2BCatalogDto>
export type B2BGetInvoicesResult = AxiosResponse<void>
export type B2BGetOrdersResult = AxiosResponse<void>
export type B2BCreateOrderResult = AxiosResponse<B2BOrderResponseDto>
export type B2BCreateQuoteResult = AxiosResponse<void>
export type CrmIntegrationsGetAuthUrlResult = AxiosResponse<void>
export type CrmIntegrationsHandleCallbackResult = AxiosResponse<void>
export type CrmIntegrationsHandleWebhookResult = AxiosResponse<void>
export type CrmIntegrationsReplyToActivityResult = AxiosResponse<void>
export type UnitsGetUnitsResult = AxiosResponse<void>
export type AnalyticsControllerGetDashboardAnalyticsResult = AxiosResponse<void>
export type AnalyticsControllerGetResourceUtilizationResult = AxiosResponse<void>
