"use server";

import {
  getPendingPurchasesForReception,
  getBatchTraceabilityList,
  receivePurchaseStockWithBatches,
} from "../../actions/purchases";
import {
  getPendingTransfersForReception,
  receiveTransferStockWithBatches,
} from "../../actions/stock-management";
import { getLocations } from "../../actions/locations";

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
