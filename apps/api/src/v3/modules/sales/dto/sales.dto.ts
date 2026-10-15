import { ApiProperty } from "@nestjs/swagger";

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
}
