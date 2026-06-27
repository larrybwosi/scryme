import type {
  Customer,
  Invoice,
  InvoiceItem,
  Transaction,
  Fulfillment,
  FulfillmentItem,
  CrmRecord,
  CrmActivity,
  CrmNote,
  Member,
  TransactionItem,
  User,
  Address,
  CrmFollowUp,
} from "@repo/db";

export type CustomerWithRelations = Customer & {
  addresses: Address[];
  invoices: (Invoice & { items: InvoiceItem[] })[];
  transactions: (Transaction & {
    fulfillments: (Fulfillment & { items: FulfillmentItem[] })[];
    items: TransactionItem[];
  })[];
  crmRecord:
    | (CrmRecord & {
        activities: (CrmActivity & {
          member: (Member & { user: User }) | null;
        })[];
        notes: (CrmNote & { createdBy: (Member & { user: User }) | null })[];
        followUps: (CrmFollowUp & {
          assignedTo: (Member & { user: User }) | null;
        })[];
      })
    | null;
};
