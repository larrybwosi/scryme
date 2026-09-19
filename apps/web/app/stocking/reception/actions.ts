"use server";

import {
  getPendingPurchasesForReception,
  getBatchTraceabilityList,
  receivePurchaseStockWithBatches,
} from "../actions/purchases";
import {
  getPendingTransfersForReception,
  receiveTransferStockWithBatches,
  getLocations,
} from "../actions/stock-management";

export async function fetchReceptionOverviewData(search?: string) {
  const [pendingPurchases, pendingTransfers, batchList, locations] =
    await Promise.all([
      getPendingPurchasesForReception(),
      getPendingTransfersForReception(),
      getBatchTraceabilityList(search),
      getLocations(),
    ]);

  return {
    pendingPurchases,
    pendingTransfers,
    batchList,
    locations,
  };
}

export { receivePurchaseStockWithBatches, receiveTransferStockWithBatches };
