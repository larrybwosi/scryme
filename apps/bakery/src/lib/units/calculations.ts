/**
 * Calculates the total quantity for an ingredient line item.
 * If using containers, quantity = numContainers * unitsPerContainer.
 */
export function calculateLineQuantity(line: {
  useContainer?: boolean;
  numContainers?: number;
  unitsPerContainer?: number;
  quantity?: number;
}): number {
  if (line.useContainer) {
    return (line.numContainers || 0) * (line.unitsPerContainer || 0);
  }
  return line.quantity || 0;
}

/**
 * Calculates the unit cost for an ingredient line item.
 * If using containers, unitCost = pricePerContainer / unitsPerContainer.
 */
export function calculateLineUnitCost(line: {
  useContainer?: boolean;
  pricePerContainer?: number;
  unitsPerContainer?: number;
  unitCost?: number;
}): number {
  if (line.useContainer) {
    return (line.unitsPerContainer || 0) > 0
      ? (line.pricePerContainer || 0) / (line.unitsPerContainer || 0)
      : 0;
  }
  return line.unitCost || 0;
}

/**
 * Calculates the total value for a single line item.
 */
export function calculateLineTotal(line: {
  useContainer?: boolean;
  numContainers?: number;
  pricePerContainer?: number;
  quantity?: number;
  unitCost?: number;
}): number {
  if (line.useContainer) {
    return (line.numContainers || 0) * (line.pricePerContainer || 0);
  }
  return (line.quantity || 0) * (line.unitCost || 0);
}

/**
 * Calculates the grand total for a set of line items.
 */
export function calculateGrandTotal(lines: any[]): number {
  return lines?.reduce((sum, line) => sum + calculateLineTotal(line), 0) || 0;
}
