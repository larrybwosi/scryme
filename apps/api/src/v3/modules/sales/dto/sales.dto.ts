import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class MetricItemDto {
  @ApiProperty({ example: "Customer" })
  title: string;

  @ApiProperty({ example: "24,139" })
  value: string;

  @ApiProperty({ example: "27%" })
  trend: string;

  @ApiProperty({ example: true })
  isUp: boolean;
}

export class TransactionSummaryDto {
  @ApiProperty({ example: "txn_123" })
  id: string;

  @ApiProperty({ example: "EchoVibe Earbuds" })
  productName: string;

  @ApiProperty({ example: "22 Sept 2024" })
  dateText: string;

  @ApiProperty({ example: "FULFILLED" })
  status: string;

  @ApiProperty({ example: "#TXN_10005" })
  transactionCode: string;
}

export class SalesAnalyticsDto {
  @ApiProperty({ example: "Jonathan" })
  userName: string;

  @ApiProperty({ example: "150841.93" })
  totalBalance: string;

  @ApiProperty({ type: [MetricItemDto] })
  metrics: MetricItemDto[];

  @ApiProperty({ type: [TransactionSummaryDto] })
  recentTransactions: TransactionSummaryDto[];
}

export class OrderLineItemDto {
  @ApiPropertyOptional({ example: "item_123" })
  id?: string;

  @ApiProperty({ example: "TimeSync Smart Watch" })
  name: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: "$45.00" })
  unitPrice: string;

  @ApiProperty({ example: "$90.00" })
  totalPrice: string;

  @ApiPropertyOptional({ example: "SKU-9921" })
  sku?: string;

  @ApiPropertyOptional({ example: "Standard packaging requested" })
  notes?: string;
}

export class OrderItemDto {
  @ApiProperty({ example: "ord_123" })
  id: string;

  @ApiProperty({ example: "TimeSync Smart Watch" })
  title: string;

  @ApiProperty({ example: "2 Items" })
  itemCountText: string;

  @ApiProperty({ example: "10:45 AM" })
  timeText: string;

  @ApiProperty({ example: "CONFIRMED" })
  status: string;

  @ApiProperty({ example: "#TXN_10018" })
  orderCode: string;

  @ApiProperty({ example: "Today" })
  groupDate: string;

  @ApiPropertyOptional({ type: [OrderLineItemDto] })
  lineItems?: OrderLineItemDto[];

  @ApiPropertyOptional({ example: "Customer requested express fulfillment" })
  customOrderNotes?: string;

  @ApiPropertyOptional({ example: "John Doe" })
  customerName?: string;

  @ApiPropertyOptional({ example: "+1 (555) 234-5678" })
  customerPhone?: string;

  @ApiPropertyOptional({ example: "johndoe@example.com" })
  customerEmail?: string;

  @ApiPropertyOptional({ example: "Delivered" })
  fulfillmentStatus?: string;

  @ApiPropertyOptional({ example: "Credit Card (Visa ending in 4242)" })
  paymentMethod?: string;

  @ApiPropertyOptional({ example: "PAID" })
  paymentStatus?: string;

  @ApiPropertyOptional({ example: "$100.00" })
  subtotal?: string;

  @ApiPropertyOptional({ example: "$10.00" })
  tax?: string;

  @ApiPropertyOptional({ example: "$0.00" })
  discount?: string;

  @ApiPropertyOptional({ example: "$110.00" })
  totalAmount?: string;

  @ApiPropertyOptional({ example: "123 Business Avenue, Suite 400" })
  deliveryAddress?: string;
}
