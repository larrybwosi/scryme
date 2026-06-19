import { Module, Global, forwardRef } from "@nestjs/common";
import { V3CommonModule } from "../../common/v3-common.module";
import { PrismaModule } from "../../../prisma/prisma.module";
import { ExpenseController } from "./interfaces/http/expense.controller";
import { PettyCashController } from "./interfaces/http/petty-cash.controller";
import { UtilityAccountController } from "./interfaces/http/utility-account.controller";
import { AccountingController } from "./interfaces/http/accounting.controller";
import {
  InvoiceController,
  PublicInvoiceController,
} from "./interfaces/http/invoice.controller";
import { ExpenseUseCase } from "./application/use-cases/expense.use-case";
import { PettyCashUseCase } from "./application/use-cases/petty-cash.use-case";
import { UtilityAccountUseCase } from "./application/use-cases/utility-account.use-case";
import { InvoiceUseCase } from "./application/use-cases/invoice.use-case";
import { DocumentModule } from "@/common/documents/document.module";
import { AccountingService } from "./application/services/accounting.service";
import { FinancialReportingService } from "./application/services/financial-reporting.service";

@Module({
  imports: [
    V3CommonModule,
    PrismaModule,
    DocumentModule,
  ],
  controllers: [
    ExpenseController,
    PettyCashController,
    UtilityAccountController,
    AccountingController,
    InvoiceController,
    PublicInvoiceController,
  ],
  providers: [
    ExpenseUseCase,
    PettyCashUseCase,
    UtilityAccountUseCase,
    InvoiceUseCase,
    AccountingService,
    FinancialReportingService,
  ],
  exports: [
    ExpenseUseCase,
    PettyCashUseCase,
    UtilityAccountUseCase,
    InvoiceUseCase,
    AccountingService,
    FinancialReportingService,
  ],
})
export class FinanceModule {}
