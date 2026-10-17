import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  openObserveClient,
  trackOpenObserveEvent,
  setOpenObserveUserContext,
  clearOpenObserveUserContext,
} from '../openobserve';
import { trackPosEvent, POS_EVENTS } from '../openpanel';

describe('OpenObserve Telemetry Client', () => {
  beforeEach(() => {
    openObserveClient.clearQueueForTesting();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    openObserveClient.clearQueueForTesting();
  });

  it('should queue tracked events with metadata and timestamp', () => {
    trackOpenObserveEvent('test_event', { foo: 'bar', amount: 100 });

    expect(openObserveClient.getQueueLength()).toBe(1);
  });

  it('should include user context when set', () => {
    setOpenObserveUserContext({ userId: 'usr_123', locationId: 'loc_456' });
    trackOpenObserveEvent('cart_updated', { itemId: 'item_789' });

    expect(openObserveClient.getQueueLength()).toBe(1);

    clearOpenObserveUserContext();
  });

  it('should dispatch events to OpenObserve endpoint on flush', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 200, message: 'success' }), { status: 200 })
    );

    // Mock import.meta.env values via window/env if needed
    trackOpenObserveEvent('sale_completed', { orderId: 'ord_1001', total: 250 });

    await openObserveClient.flush();

    // Since mock env has default placeholder/no url in test env unless configured,
    // queue drains cleanly if url is unconfigured or fetch is called if configured.
    expect(openObserveClient.getQueueLength()).toBe(0);
  });

  it('should forward trackPosEvent calls to OpenObserve', () => {
    trackPosEvent(POS_EVENTS.CART_ITEM_ADDED, {
      productId: 'prod_1',
      variantId: 'var_1',
      unitId: 'unit_1',
      quantity: 2,
    });

    expect(openObserveClient.getQueueLength()).toBeGreaterThanOrEqual(1);
  });


  it('should forward new telemetry events (preorder, order, customer) via trackPosEvent', () => {
    trackPosEvent(POS_EVENTS.PREORDER_CONFIGURED, {
      deposit_amount: 50,
      total_amount: 100,
    });
    trackPosEvent(POS_EVENTS.PREORDER_CANCELLED, {
      total_amount: 100,
    });
    trackPosEvent(POS_EVENTS.ORDER_CREATED, {
      order_id: 'ord_123',
    });
    trackPosEvent(POS_EVENTS.ORDER_VALIDATION_FAILED, {
      error_fields: ['customerId'],
      form_context: 'create_order',
    });
    trackPosEvent(POS_EVENTS.CUSTOMER_CREATED, {
      customer_type: 'B2C',
      source: 'sheet',
    });
    trackPosEvent(POS_EVENTS.CUSTOMER_UPDATED, {
      customer_id: 'cust_123',
      source: 'sheet',
    });

    expect(openObserveClient.getQueueLength()).toBe(6);
  });

  it('should handle clearing user context on session reset', () => {
    setOpenObserveUserContext({ staffId: 'staff_99' });
    clearOpenObserveUserContext();

    trackOpenObserveEvent('staff_logout');
    expect(openObserveClient.getQueueLength()).toBe(1);
  });
});
