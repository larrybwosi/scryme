
export interface InventoryItem {
  id: string;
  productId: string;
  variantId: string;
  locationId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  reorderQty: number;
  lastUpdated: Date;
  organizationId: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  variant: {
    id: string;
    name: string;
    sku: string;
    baseUnit: SystemUnit;
    stockingUnit: SystemUnit;
  };
  location: {
    id: string;
    name: string;
    locationType: LocationType;
  };
}

interface SystemUnit {
  id: string;
  name: string;
  symbol: string;
  type: UnitType;
}

enum UnitType {
  COUNT = 'COUNT',
  WEIGHT = 'WEIGHT',
  VOLUME = 'VOLUME',
  LENGTH = 'LENGTH',
  AREA = 'AREA',
  TIME = 'TIME',
  OTHER = 'OTHER',
}

enum LocationType {
  RETAIL_SHOP = 'RETAIL_SHOP',
  WAREHOUSE = 'WAREHOUSE',
  DISTRIBUTION = 'DISTRIBUTION',
  PRODUCTION = 'PRODUCTION',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER',
  TEMPORARY = 'TEMPORARY',
  OTHER = 'OTHER',
}

export interface InventoryMovement {
  id: string;
  variantId: string;
  stockBatchId: string | null;
  quantity: number;
  fromLocationId: string | null;
  toLocationId: string | null;
  movementType: MovementType;
  referenceId: string | null;
  referenceType: string | null;
  memberId: string;
  notes: string | null;
  movementDate: Date;
  createdAt: Date;
  organizationId: string;
  variant: {
    id: string;
    name: string;
  };
  stockBatch: {
    id: string;
    batchNumber: string | null;
  } | null;
  fromLocation: {
    id: string;
    name: string;
  } | null;
  toLocation: {
    id: string;
    name: string;
  } | null;
  member: {
    id: string;
    user: {
      name: string | null;
    };
  };
}

enum MovementType {
  PURCHASE_RECEIPT = 'PURCHASE_RECEIPT',
  SALE = 'SALE',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  TRANSFER = 'TRANSFER',
  CUSTOMER_RETURN = 'CUSTOMER_RETURN',
  SUPPLIER_RETURN = 'SUPPLIER_RETURN',
  INITIAL_STOCK = 'INITIAL_STOCK',
  PRODUCTION_IN = 'PRODUCTION_IN',
  PRODUCTION_OUT = 'PRODUCTION_OUT',
}

export interface InventoryAdjustment {
  id: string;
  variantId: string;
  stockBatchId: string | null;
  locationId: string;
  memberId: string;
  quantity: number;
  reason: StockAdjustmentReason;
  notes: string | null;
  adjustmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
  referenceNumber: string | null;
  organizationId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  variant: {
    id: string;
    name: string;
  };
  stockBatch: {
    id: string;
    batchNumber: string | null;
  } | null;
  location: {
    id: string;
    name: string;
  };
  member: {
    id: string;
    user: {
      name: string | null;
    };
  };
}

enum StockAdjustmentReason {
  INITIAL_STOCK = 'INITIAL_STOCK',
  RECEIVED_PURCHASE = 'RECEIVED_PURCHASE',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  LOST = 'LOST',
  STOLEN = 'STOLEN',
  FOUND = 'FOUND',
  RETURN_TO_SUPPLIER = 'RETURN_TO_SUPPLIER',
  CUSTOMER_RETURN = 'CUSTOMER_RETURN',
  INVENTORY_COUNT = 'INVENTORY_COUNT',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  OTHER = 'OTHER',
}
