<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Dealio Desktop POS application. PostHog was initialized in `src/main.tsx` with `posthog-js` and the `@posthog/react` `PostHogProvider` wrapper. The API key and host are read from environment variables (`VITE_PUBLIC_POSTHOG_KEY` / `VITE_PUBLIC_POSTHOG_HOST`) stored in `.env`. Ten business-critical events were instrumented across 7 files, replacing the previously commented-out Aptabase `trackEvent` calls. User identification via `posthog.identify()` is performed on staff check-in, and `posthog.reset()` is called on check-out and device reset to cleanly separate sessions. React error boundary exceptions are now forwarded to PostHog via `posthog.captureException()`.

| Event                       | Description                                                               | File                                    |
| --------------------------- | ------------------------------------------------------------------------- | --------------------------------------- |
| `user_checked_in`           | Staff member logs in to the POS terminal                                  | `src/hooks/use-auth.ts`                 |
| `user_checked_out`          | Staff member logs out from the POS terminal                               | `src/hooks/use-auth.ts`                 |
| `sale_completed`            | A sale is successfully processed, with total, payment method, items count | `src/components/pos/payment-dialog.tsx` |
| `product_added_to_cart`     | A product is added via barcode scan on the POS page                       | `src/pages/pos.tsx`                     |
| `pricing_mode_changed`      | User switches between retail and wholesale pricing                        | `src/pages/pos.tsx`                     |
| `product_category_selected` | User filters products by a specific category                              | `src/pages/pos.tsx`                     |
| `device_reset`              | User confirms a full device reset on the check-in page                    | `src/pages/checkin.tsx`                 |
| `order_created`             | A new sales order is created from the create-order page                   | `src/pages/create-order.tsx`            |
| `stock_delivery_accepted`   | A stock delivery or transfer shipment is accepted                         | `src/pages/stock-acceptance.tsx`        |
| `order_held`                | Cashier puts the current order on hold                                    | `src/components/hold-order-dialog.tsx`  |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://eu.posthog.com/project/137539/dashboard/557536)
- **Insight**: [Daily Sales & Revenue](https://eu.posthog.com/project/137539/insights/qAPh1XvA) — daily sales count and revenue sum
- **Insight**: [Session Funnel: Check-in → Cart → Sale](https://eu.posthog.com/project/137539/insights/dKTc8Kvu) — conversion funnel from staff check-in to completed sale
- **Insight**: [Sales by Payment Method](https://eu.posthog.com/project/137539/insights/KAe64p5t) — breakdown of sales by payment method
- **Insight**: [Staff Check-ins vs Check-outs](https://eu.posthog.com/project/137539/insights/fvdqatal) — daily staff session activity
- **Insight**: [Held Orders vs Completed Sales](https://eu.posthog.com/project/137539/insights/oUeBXAVl) — weekly held-order rate as a friction indicator

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-react-react-router-7-framework/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
