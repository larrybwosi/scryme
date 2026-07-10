import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceItemDto,
  InvoiceConfigDto,
} from "../dto/invoice.dto";
import { DocumentService } from "@/common/documents/document.service";
import { navariService } from "@repo/shared/suppliers/server";
import { Mappers } from "@repo/documents/server";

@Injectable()
export class InvoiceUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentService: DocumentService,
  ) {}

  async createInvoice(organizationId: string, dto: CreateInvoiceDto) {
    const { items, customer, ...invoiceData } = dto;
    const { netTotal, totalTaxes, grandTotal } = this.calculateTotals(items);

    return await this.prisma.client.invoice.create({
      data: {
        ...invoiceData,
        customerName: customer,
        organizationId,
        netTotal,
        totalTaxes,
        grandTotal,
        balanceDue: grandTotal,
        items: { create: items },
      },
      // ⚡ Bolt Optimization: Use targeted select for scalar fields and items
      // to reduce database payload size and serialization overhead.
      select: {
        id: true,
        customerId: true,
        customerName: true,
        postingDate: true,
        dueDate: true,
        netTotal: true,
        totalTaxes: true,
        grandTotal: true,
        amountPaid: true,
        balanceDue: true,
        status: true,
        kraPin: true,
        kraCompliant: true,
        etrMode: true,
        organizationId: true,
        transactionId: true,
        templateId: true,
        templateVersion: true,
        createdAt: true,
        updatedAt: true,
        items: true,
      },
    });
  }

  private calculateTotals(items: InvoiceItemDto[]) {
    const netTotal = items.reduce((acc, item) => acc + item.amount, 0);
    const totalTaxes = items.reduce((acc, item) => acc + item.amount * 0.16, 0);
    const grandTotal = netTotal + totalTaxes;
    return { netTotal, totalTaxes, grandTotal };
  }

  async createInvoiceFromOrder(organizationId: string, orderId: string) {
    const order = await this.prisma.client.transaction.findFirst({
      where: { id: orderId, organizationId },
      // ⚡ Bolt Optimization: Use targeted select for order data and items
      // to reduce database load and serialization overhead.
      select: {
        id: true,
        totalPaid: true,
        finalTotal: true,
        subtotal: true,
        businessAccount: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            sku: true,
            productName: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException("Order not found");

    const totalPaid = Number(order.totalPaid || 0);
    const grandTotal = Number(order.finalTotal);
    const balanceDue = grandTotal - totalPaid;

    let status = "UNPAID";
    if (totalPaid >= grandTotal) {
      status = "PAID";
    } else if (totalPaid > 0) {
      status = "PARTIALLY_PAID";
    }

    return await this.prisma.client.invoice.create({
      data: {
        organizationId,
        transactionId: order.id,
        customerName: order.businessAccount?.name || "Walk-in Customer",
        postingDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        netTotal: Number(order.subtotal),
        totalTaxes: Number(order.finalTotal) - Number(order.subtotal),
        grandTotal: Number(order.finalTotal),
        amountPaid: totalPaid,
        balanceDue: balanceDue,
        status: status,
        items: {
          create: order.items.map(item => ({
            itemCode: item.sku || "N/A",
            itemName: `${item.productName} ${item.variantName}`,
            quantity: item.quantity,
            rate: Number(item.unitPrice),
            amount: Number(item.lineTotal),
          })),
        },
      },
    });
  }

  async getInvoices(organizationId: string) {
    return await this.prisma.client.invoice.findMany({
      where: { organizationId },
      // ⚡ Bolt Optimization: Use targeted select for list view to reduce database load
      // and network payload size by excluding large relations like 'items'.
      select: {
        id: true,
        customerName: true,
        postingDate: true,
        dueDate: true,
        grandTotal: true,
        amountPaid: true,
        balanceDue: true,
        status: true,
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getInvoiceById(organizationId: string, invoiceId: string) {
    // ⚡ Bolt Optimization: Shared select block for detail view and status synchronization.
    const invoiceSelect = {
      id: true,
      customerId: true,
      customerName: true,
      postingDate: true,
      dueDate: true,
      netTotal: true,
      totalTaxes: true,
      grandTotal: true,
      amountPaid: true,
      balanceDue: true,
      status: true,
      kraPin: true,
      kraCompliant: true,
      etrMode: true,
      organizationId: true,
      transactionId: true,
      templateId: true,
      templateVersion: true,
      createdAt: true,
      updatedAt: true,
      items: true,
      template: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          templateData: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      transaction: {
        select: {
          id: true,
          totalPaid: true,
          finalTotal: true,
        },
      },
    };

    const invoice = await this.prisma.client.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      select: invoiceSelect,
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    // Sync with transaction if it exists
    if (invoice.transaction) {
      const totalPaid = Number(invoice.transaction.totalPaid || 0);
      const grandTotal = Number(invoice.transaction.finalTotal);
      const balanceDue = grandTotal - totalPaid;

      let status = invoice.status;
      if (totalPaid >= grandTotal) {
        status = "PAID";
      } else if (totalPaid > 0) {
        status = "PARTIALLY_PAID";
      } else if (status !== "DRAFT") {
        status = "UNPAID";
      }

      if (invoice.amountPaid !== totalPaid || invoice.status !== status) {
        return await this.prisma.client.invoice.update({
          where: { id: invoiceId },
          data: {
            amountPaid: totalPaid,
            balanceDue: balanceDue,
            status: status,
          },
          select: invoiceSelect,
        });
      }
    }

    return invoice;
  }

  async updateInvoice(
    organizationId: string,
    invoiceId: string,
    dto: UpdateInvoiceDto,
  ) {
    const { items, customer, templateId, ...invoiceData } = dto;
    const invoice = await this.getInvoiceById(organizationId, invoiceId);
    if (invoice.status === "PAID")
      throw new BadRequestException("Cannot update a paid invoice");

    const { netTotal, totalTaxes, grandTotal } = this.calculateTotals(items);

    return await this.prisma.client.invoice.update({
      where: { id: invoiceId },
      data: {
        ...invoiceData,
        netTotal,
        totalTaxes,
        grandTotal,
        items: {
          deleteMany: {},
          create: items,
        },
      },
      // ⚡ Bolt Optimization: Use targeted select for scalar fields and items
      // to reduce database payload size and serialization overhead.
      select: {
        id: true,
        customerId: true,
        customerName: true,
        postingDate: true,
        dueDate: true,
        netTotal: true,
        totalTaxes: true,
        grandTotal: true,
        amountPaid: true,
        balanceDue: true,
        status: true,
        kraPin: true,
        kraCompliant: true,
        etrMode: true,
        organizationId: true,
        transactionId: true,
        templateId: true,
        templateVersion: true,
        createdAt: true,
        updatedAt: true,
        items: true,
      },
    });
  }

  async deleteInvoice(organizationId: string, invoiceId: string) {
    const invoice = await this.getInvoiceById(organizationId, invoiceId);
    if (invoice.status === "PAID")
      throw new BadRequestException("Cannot delete a paid invoice");
    return await this.prisma.client.invoice.delete({
      where: { id: invoiceId },
    });
  }

  async finalizeInvoice(organizationId: string, invoiceId: string) {
    const invoice = await this.getInvoiceById(organizationId, invoiceId);
    const complianceData = await this.handleKRACompliance(
      organizationId,
      invoice,
    );

    const updatedInvoice = await this.prisma.client.invoice.update({
      where: { id: invoiceId },
      data: { status: "UNPAID" },
    });

    return { ...updatedInvoice, complianceData };
  }

  async handleKRACompliance(
    organizationId: string,
    invoice: {
      id: string;
      customerName: string | null;
      kraPin: string | null;
      netTotal: number;
      totalTaxes: number;
      grandTotal: number;
      etrMode: boolean;
      items: { itemName: string; quantity: number; rate: number; amount: number }[];
    },
  ) {
    const org = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      include: { settings: true },
    });

    if (
      org?.settings?.taxIntegrationEnabled &&
      org?.settings?.country === "Kenya"
    ) {
      try {
        const result = await navariService.generateETRInvoice(organizationId, {
          invoiceId: invoice.id,
          customer: String(invoice.customerName || "Walk-in Customer"),
          kraPin: String(invoice.kraPin || "A000000000X"),
          netTotal: Number(invoice.netTotal || 0),
          totalTaxes: Number(invoice.totalTaxes || 0),
          grandTotal: Number(invoice.grandTotal || 0),
          etrMode: Boolean(invoice.etrMode),
          items: (invoice.items || []).map((i) => ({
            description: String(i.itemName || "Item"),
            quantity: Number(i.quantity || 0),
            price: Number(i.rate || 0),
            amount: Number(i.amount || 0),
          })),
        });

        await this.prisma.client.invoice.update({
          where: { id: invoice.id },
          data: { kraCompliant: true },
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Navari ETR Generation failed:", errorMessage);
        return { error: errorMessage, status: "FAILED" };
      }
    }
    return null;
  }

  async getDownloadStreamDirect(invoiceId: string, organizationId: string) {
    // SECURITY (Sentinel): Use findFirst with organizationId scoping to prevent IDOR.
    const invoice = await this.prisma.client.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: {
        transaction: {
          include: {
            attachments: true,
            items: true,
            customer: { include: { addresses: true } },
            organization: {
              include: {
                settings: true,
                invoiceConfig: true,
                receiptConfig: true,
              },
            },
            location: true,
            payments: true,
            member: { include: { user: { select: { name: true } } } },
          },
        },
        organization: {
          include: {
            settings: true,
            invoiceConfig: true,
            receiptConfig: true,
          },
        },
        items: true,
        template: true,
      },
    });

    if (!invoice) throw new NotFoundException("Invoice not found");

    // Check if we should use V3 templates
    if (invoice.templateId?.startsWith("invoice-v3-")) {
      const v3Data = Mappers.toV3DocumentData(invoice as any, "invoice");

      let qrCode: string | undefined;
      try {
        const QRCode = await import("qrcode");
        qrCode = await QRCode.toDataURL(invoice.id);
      } catch (e) {
        console.error("Failed to generate QR code", e);
      }

      return this.documentService.generateV3DocumentPDF(
        invoice.templateId,
        v3Data,
        qrCode,
      );
    }

    // If it's linked to a transaction, check if an up-to-date invoice attachment exists
    if (invoice.transactionId) {
      const referenceDate = invoice.transaction?.updatedAt
        ? new Date(invoice.transaction.updatedAt)
        : new Date(invoice.updatedAt);

      const existingDoc = invoice.transaction?.attachments?.find(
        (a) =>
          a.description === "Invoice" &&
          new Date(a.uploadedAt) >= referenceDate,
      );

      if (existingDoc?.fileUrl) {
        const { storageService } = await import("@repo/shared/storage");
        return await storageService.getDownloadStream(existingDoc.fileUrl);
      }

      // Generate and save if it's linked to a transaction but no valid attachment exists
      const { documentService: sharedDocService } = await import(
        "@repo/shared/lib"
      );
      const attachment = await sharedDocService.generateAndSaveInvoice(
        invoice.transactionId,
        invoice.organizationId,
        null,
      );

      const { storageService } = await import("@repo/shared/storage");
      return await storageService.getDownloadStream(attachment.fileUrl!);
    }

    // Standalone invoices fallback (not linked to a transaction)
    const invoiceData = Mappers.toInvoiceData(invoice as any, {});

    return this.documentService.generateInvoicePDF(invoiceData);
  }

  async getReceiptDownloadStream(transactionId: string, organizationId: string) {
    // SECURITY (Sentinel): Use findFirst with organizationId scoping to prevent IDOR.
    const transaction = await this.prisma.client.transaction.findFirst({
      where: { id: transactionId, organizationId },
      include: {
        attachments: true,
        items: true,
        member: { include: { user: { select: { name: true } } } },
        location: true,
        customer: { include: { addresses: true } },
        payments: true,
        organization: {
          include: {
            settings: true,
            receiptConfig: true,
            invoiceConfig: true,
          },
        },
      },
    });

    if (!transaction) throw new NotFoundException("Transaction not found");

    // Check if we should use V3 templates (if any default receipt template is V3)
    const templateId =
      transaction.organization?.settings?.defaultReceiptTemplate;
    if (templateId?.startsWith("receipt-v3-")) {
      const v3Data = Mappers.toV3DocumentData(transaction as any, "receipt");

      let qrCode: string | undefined;
      try {
        const QRCode = await import("qrcode");
        qrCode = await QRCode.toDataURL(transaction.number);
      } catch (e) {
        console.error("Failed to generate QR code", e);
      }

      return this.documentService.generateV3DocumentPDF(
        templateId,
        v3Data,
        qrCode,
      );
    }

    const existingDoc = transaction.attachments?.find(
      (a) =>
        a.description === "Receipt" &&
        new Date(a.uploadedAt) >= new Date(transaction.updatedAt),
    );

    if (existingDoc?.fileUrl) {
      const { storageService } = await import("@repo/shared/storage");
      return await storageService.getDownloadStream(existingDoc.fileUrl);
    }

    // Generate and save
    const { documentService: sharedDocService } = await import(
      "@repo/shared/lib"
    );
    const attachment = await sharedDocService.generateAndSaveReceipt(
      transactionId,
      transaction.organizationId,
      null,
    );

    const { storageService } = await import("@repo/shared/storage");
    return await storageService.getDownloadStream(attachment.fileUrl!);
  }

  async getTemplates(organizationId: string) {
    /**
     * OPTIMIZATION (Bolt ⚡): Replaced broad query with targeted 'select'.
     * Excluding the heavy 'templateData' JSON field (containing layout and styles)
     * for the list view significantly reduces database I/O and network payload.
     * Estimated impact: ~80-90% reduction in response payload size for organizations
     * with multiple custom templates.
     */
    return await this.prisma.client.invoiceTemplate.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        type: true,
        isActive: true,
        isDefault: true,
        logoUrl: true,
        showLineNumbers: true,
        showTaxBreakdown: true,
        showTerms: true,
        showNotes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createTemplate(organizationId: string, data: any) {
    return await this.prisma.client.invoiceTemplate.create({
      data: {
        ...data,
        organizationId,
        templateData: data.templateData || {},
      },
    });
  }

  async getInvoiceConfig(organizationId: string) {
    let config = await this.prisma.client.invoiceConfig.findUnique({
      where: { organizationId },
    });

    if (!config) {
      config = await this.prisma.client.invoiceConfig.create({
        data: { organizationId },
      });
    }

    return config;
  }

  async updateInvoiceConfig(organizationId: string, dto: InvoiceConfigDto) {
    return await this.prisma.client.invoiceConfig.upsert({
      where: { organizationId },
      update: dto,
      create: {
        ...dto,
        organizationId,
      },
    });
  }
}
