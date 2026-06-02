import prisma from "@repo/db";
import { Decimal } from "decimal.js";

/**
 * Unit Conversion Engine
 *
 * Provides high-performance, graph-based unit conversion with support for:
 * - System-level global conversions (lowest priority)
 * - Organization-level custom conversions (medium priority)
 * - Product-specific unit overrides (highest priority)
 *
 * Uses Breadth-First Search (BFS) to find the shortest conversion path.
 */

export interface ConversionEdge {
  toUnitId: string;
  factor: number;
  offset: number;
  priority: number;
  productId?: string;
}

export type ConversionGraph = Map<string, ConversionEdge[]>;

class ConversionService {
  /**
   * Builds a conversion graph for a specific organization and set of products.
   * @param organizationId - The ID of the organization
   * @param productIds - Optional array of product IDs to include specific conversions for
   */
  public async buildGraph(
    organizationId: string,
    productIds: string[] = [],
  ): Promise<ConversionGraph> {
    const graph: ConversionGraph = new Map();

    const [systemConversions, orgConversions, productConversions] =
      await Promise.all([
        prisma.unitConversion.findMany(),
        prisma.orgUnitConversion.findMany({ where: { organizationId } }),
        productIds.length > 0
          ? prisma.productUnitConversion.findMany({
              where: { productId: { in: productIds } },
            })
          : Promise.resolve([]),
      ]);

    const addEdge = (
      from: string,
      to: string,
      factor: number,
      offset: number,
      priority: number,
      productId?: string,
    ) => {
      if (!graph.has(from)) graph.set(from, []);

      const edges = graph.get(from)!;
      const existingIndex = edges.findIndex((e) => e.toUnitId === to);

      if (existingIndex !== -1) {
        // Replace if higher priority
        if (priority > edges[existingIndex].priority) {
          edges[existingIndex] = {
            toUnitId: to,
            factor,
            offset,
            priority,
            productId,
          };
        }
      } else {
        edges.push({ toUnitId: to, factor, offset, priority, productId });
      }
    };

    // 1. System (Lowest Priority: 1)
    systemConversions.forEach((c: any) => {
      const f = Number(c.factor);
      const o = Number(c.offset);
      addEdge(c.fromUnitId, c.toUnitId, f, o, 1);
      if (f !== 0) addEdge(c.toUnitId, c.fromUnitId, 1 / f, -o / f, 1);
    });

    // 2. Org (Medium Priority: 2)
    orgConversions.forEach((c: any) => {
      const f = Number(c.factor);
      const o = Number(c.offset);
      addEdge(c.fromUnitId, c.toUnitId, f, o, 2);
      if (f !== 0) addEdge(c.toUnitId, c.fromUnitId, 1 / f, -o / f, 2);
    });

    // 3. Product (Highest Priority: 3+)
    productConversions.forEach((c: any) => {
      const f = Number(c.factor);
      const o = Number(c.offset);
      const p = 3 + (c.priority || 0);
      addEdge(c.fromUnitId, c.toUnitId, f, o, p, c.productId);
      if (f !== 0)
        addEdge(c.toUnitId, c.fromUnitId, 1 / f, -o / f, p, c.productId);
    });

    return graph;
  }

  /**
   * Converts a value between two units using the provided graph.
   */
  public convert(
    value: number | Decimal,
    fromUnitId: string,
    toUnitId: string,
    graph: ConversionGraph,
    targetProductId?: string,
  ): { value: number } | { error: string } {
    const startVal = typeof value === "number" ? value : value.toNumber();

    if (fromUnitId === toUnitId) return { value: startVal };

    const queue: Array<{ id: string; currentVal: number }> = [
      { id: fromUnitId, currentVal: startVal },
    ];
    const visited = new Set<string>([fromUnitId]);

    while (queue.length > 0) {
      const { id, currentVal } = queue.shift()!;

      const edges = graph.get(id);
      if (!edges) continue;

      for (const edge of edges) {
        // Enforce Product Constraint: Only use edges meant for this product (or generic ones)
        if (edge.productId && edge.productId !== targetProductId) continue;

        if (!visited.has(edge.toUnitId)) {
          visited.add(edge.toUnitId);
          const nextVal = currentVal * edge.factor + edge.offset;

          if (edge.toUnitId === toUnitId) {
            return { value: nextVal };
          }

          queue.push({ id: edge.toUnitId, currentVal: nextVal });
        }
      }
    }

    return {
      error: `No conversion path found from ${fromUnitId} to ${toUnitId}`,
    };
  }

  /**
   * Helper to perform a conversion in a single call (builds graph internally).
   * Use buildGraph + convert for batch operations.
   */
  public async convertDirect(
    value: number | Decimal,
    fromUnitId: string,
    toUnitId: string,
    organizationId: string,
    productId?: string,
  ): Promise<{ value: number } | { error: string }> {
    const graph = await this.buildGraph(
      organizationId,
      productId ? [productId] : [],
    );
    return this.convert(value, fromUnitId, toUnitId, graph, productId);
  }
}

export const conversionService = new ConversionService();
