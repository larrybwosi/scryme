# 0022. Enterprise Loyalty Points System & Multi-Tier Customization Architecture

**Date**: 2026-11-04
**Status**: Accepted

## Summary

This specification defines the architecture, data models, APIs, security isolation, and web management interface for the Enterprise Loyalty Points System in Scryme. The enhanced system enables multi-tenant organizations to configure highly customizable loyalty programs with multi-tier membership ladders, multi-faceted earning rules (currency spend, product/category rules, bonus events), flexible redemption mechanisms (direct pay-with-points at checkout and reward vouchers), configurable points expiration policies with automated batch processing, staff manual adjustments with strict auditing, and enterprise RBAC permissions.

## Context

Organizations operating on Scryme require comprehensive customer retention and loyalty capabilities. Previously:
1. The loyalty schema possessed baseline data models (`LoyaltyProgram`, `LoyaltyTier`, `LoyaltyRule`, `LoyaltyReward`, `LoyaltyVoucher`, `LoyaltyTransaction`) in `packages/db`, but lacked full enterprise configuration capabilities such as checkout redemption policies, maximum redemption percentages, minimum point redemption thresholds, and staff audit tracking.
2. The V3 API (`apps/api/src/v3/modules/loyalty`) only implemented basic point calculation, single-point awarding, and voucher redemption, without full CRUD operations for program configuration, tier ladders, rules engine, manual point adjustments, customer loyalty transaction auditing, or point expiry batch runs.
3. Organizations lacked an administrative interface in `apps/web` to configure their loyalty program, establish tier structures, author earning rules, create redeemable catalog rewards, monitor customer points, or perform audited point adjustments.
4. The loyalty module was not registered as a platform module in `PLATFORM_MODULES`, preventing fine-grained tenant-level module activation and license entitlement gating.

## Requirements

### User Stories
- **As an Organization Administrator**: I want to configure a branded loyalty program with custom point labels (e.g., "Points", "Stars", "Coins"), exchange rates, expiry rules, and minimum/maximum redemption thresholds so that my loyalty program aligns with business margins.
- **As a Store Manager / Staff Member**: I want to view customer loyalty tiers, adjust points manually with mandatory audit reason codes and member tracking, and trigger or schedule point expiry sweeps.
- **As a Cashier / POS Operator**: I want customers to be able to redeem catalog vouchers or directly apply points toward their sales order total via pay-with-points conversion rates.
- **As a Customer**: I want to earn points dynamically across transactions, unlock higher membership tiers with point multipliers, and redeem rewards seamlessly.

### Acceptance Criteria
- **AC-1 (Platform Module Registration)**: `loyalty` must be registered in `PLATFORM_MODULES` (`packages/shared/src/constants/modules.ts`) as a core module with enabled-by-default status.
- **AC-2 (Schema & Configuration Model)**: `LoyaltyProgram` supports enterprise checkout redemption configurations including `minRedeemPoints`, `maxRedemptionPercentage`, and direct point exchange rate conversions.
- **AC-3 (Enterprise Rules Engine)**: Organizations can create and manage rules for `POINTS_PER_CURRENCY` (e.g. 1 pt per $1 spent), `POINTS_PER_ITEM` (category/product/variant bonuses), and `FIXED_POINTS` (signups/events) with minimum order values and validity date ranges.
- **AC-4 (Tier Ladder & Multipliers)**: Multi-tier structure supporting custom minimum point thresholds, point accumulation multipliers (e.g. 1.25x for Gold, 1.5x for Platinum), colors, icons, and tier basis (`CURRENT_BALANCE` vs `LIFETIME_POINTS`).
- **AC-5 (Redemption Options)**: Support dual redemption paths:
  1. Direct Pay-with-Points: calculating discount value from points at POS/checkout respecting min points and max discount percentages.
  2. Reward Vouchers: redeeming points for percentage discounts, fixed amount discounts, free products, or store credits.
- **AC-6 (Points Expiration & Inactivity Sweeps)**: Automated batch calculation of point expiry for accounts inactive beyond `expiryMonths`, logging `EXPIRED` transactions.
- **AC-7 (Manual Adjustments & Audit Trail)**: Staff manual point additions or deductions require mandatory reason notes, recording `ADJUSTED` transactions with staff `memberId` and customer balance snapshots.
- **AC-8 (RBAC & Multi-Tenant BOLA Isolation)**: API endpoints and web server actions enforce tenant isolation and permission checks (`loyalty:manage`, `loyalty:read`, `loyalty:adjust`).
- **AC-9 (Web Management Dashboard)**: Comprehensive management dashboard at `/settings/loyalty` in `apps/web` with tabbed navigation: Overview & Program Settings, Tiers, Earning Rules, Rewards Catalog, and Customer Ledger & Adjustments.

## Architecture & Design

### 1. Data Model Enhancements (`packages/db/prisma/schema/loyalty.prisma`)
The `LoyaltyProgram` model is updated with enterprise checkout redemption parameters:
- `minRedeemPoints`: Minimum points balance needed before a customer can redeem points directly at checkout (default: 0).
- `maxRedemptionPercentage`: Maximum percentage of an order total that can be paid via points (e.g. 50% or 100%, default: 100).
- `allowDirectRedemption`: Boolean flag allowing direct "Pay with Points" at checkout without issuing a separate voucher (default: true).

### 2. V3 Loyalty API Surface (`apps/api/src/v3/modules/loyalty`)
Endpoints under `/:orgSlug/loyalty`:
- `GET /program`: Retrieve current organization loyalty program with tiers, rules, and rewards.
- `PUT /program`: Upsert/update loyalty program settings.
- `POST /tiers`: Create loyalty tier.
- `PUT /tiers/:id`: Update loyalty tier.
- `DELETE /tiers/:id`: Remove loyalty tier.
- `POST /rules`: Create earning rule.
- `PUT /rules/:id`: Update earning rule.
- `DELETE /rules/:id`: Remove earning rule.
- `POST /rewards`: Create redeemable reward.
- `PUT /rewards/:id`: Update redeemable reward.
- `DELETE /rewards/:id`: Remove redeemable reward.
- `POST /redeem-direct`: Direct pay-with-points redemption calculation and deduction.
- `POST /process-expirations`: Batch job for evaluating and expiring overdue points balances.
- `POST /customers/:id/adjust`: Audited manual staff points adjustment.
- `GET /customers/:id/history`: Customer loyalty transaction history.
- `GET /analytics`: Loyalty program metrics (total points issued, redeemed, active members).

### 3. Server Actions & Web UI (`apps/web`)
- Server Actions in `apps/web/app/actions/loyalty.ts` providing type-safe, authenticated, tenant-isolated functions for Web components.
- Navigation link registered in `apps/web/components/sidebar.tsx` under Settings as "Loyalty Program" (`/settings/loyalty`).
- Management page at `apps/web/app/settings/loyalty/page.tsx` rendering an interactive tabbed management suite.
