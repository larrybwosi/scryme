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
} from "../dto/invoice.dto";
import { DocumentService } from "@/common/documents/document.service";
import { navariService } from "@repo/suppliers/server";
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
    await this.handleKRACompliance(organizationId, invoice);

    return await this.prisma.client.invoice.update({
      where: { id: invoiceId },
      data: { status: "UNPAID" },
    });
  }

  private async handleKRACompliance(organizationId: string, invoice: any) {
    const org = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      include: { settings: true },
    });

    if (
      org?.settings?.taxIntegrationEnabled &&
      org?.settings?.country === "Kenya"
    ) {
      try {
        await navariService.generateETRInvoice(organizationId, {
          invoiceId: invoice.id,
          customer: invoice.customer,
          kraPin: invoice.kraPin,
          netTotal: invoice.netTotal,
          totalTaxes: invoice.totalTaxes,
          grandTotal: invoice.grandTotal,
          etrMode: invoice.etrMode,
          items: invoice.items.map(i => ({
            description: i.itemName,
            quantity: i.quantity,
            price: i.rate,
            amount: i.amount,
          })),
        });
        await this.prisma.client.invoice.update({
          where: { id: invoice.id },
          data: { kraCompliant: true },
        });
      } catch (error) {
        console.error("Navari ETR Generation failed:", error.message);
      }
    }
  }

  async getDownloadStreamDirect(invoiceId: string) {
    const invoice = await this.prisma.client.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        organization: {
          include: {
            settings: true,
            invoiceConfig: true,
          },
        },
        template: true,
      },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    const invoiceData = Mappers.toInvoiceData(
      {
        ...invoice,
        number: invoice.id.substring(0, 8).toUpperCase(),
        subtotal: invoice.netTotal,
        taxTotal: invoice.totalTaxes,
        finalTotal: invoice.grandTotal,
        createdAt: invoice.postingDate,
        payments: [{ amount: invoice.amountPaid }],
      },
      {},
    );

    return this.documentService.generateInvoicePDF(invoiceData);
  }

  async getReceiptDownloadStream(transactionId: string) {
    const transaction = await this.prisma.client.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: true,
        customer: {
          include: {
            addresses: true,
          },
        },
        organization: {
          include: {
            settings: true,
            receiptConfig: true,
          },
        },
        payments: true,
        location: true,
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!transaction) throw new NotFoundException("Transaction not found");

    const receiptData = Mappers.toReceiptData(transaction);

    return this.documentService.generateReceiptPDF(receiptData);
  }

  async getTemplates(organizationId: string) {
    return await this.prisma.client.invoiceTemplate.findMany({
      where: { organizationId, isActive: true },
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

  async updateInvoiceConfig(organizationId: string, data: any) {
    return await this.prisma.client.invoiceConfig.upsert({
      where: { organizationId },
      update: data,
      create: {
        ...data,
        organizationId,
      },
    });
  }
}
