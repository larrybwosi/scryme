import {
  DocumentGenerator,
  Mappers,
  SimpleInvoicePDF,
  DeliveryNoteDocument,
  getInvoiceTemplate,
  getTemplateById,
  isV3Template,
  ReceiptTemplateV2,
} from "@repo/documents/server";
import { storageService } from "../../storage";
import { db } from "@repo/db";
import { notificationEngine } from "@repo/notifications";
import React from "react";
import QRCode from "qrcode";

export class DocumentService {
  /**
   * Generates and attaches Invoice and Delivery Note to a Transaction/Fulfillment.
   */
  async generateAndAttachProofDocuments(params: {
    transactionId: string;
    fulfillmentId: string;
    organizationId: string;
    memberId: string;
  }) {
    const { transactionId, fulfillmentId, organizationId, memberId } = params;

    // 1. Fetch transaction with full details
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId, organizationId },
      include: {
        items: true,
        customer: { include: { addresses: true } },
        organization: {
          include: {
            settings: true,
            invoiceConfig: true,
          },
        },
        location: true,
        payments: true,
        fulfillments: {
          where: { id: fulfillmentId },
          include: { shippingAddress: true },
        },
      },
    });

    if (!transaction) throw new Error("Transaction not found");
    const fulfillment = transaction.fulfillments[0];
    if (!fulfillment) throw new Error("Fulfillment not found");

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.fulfillment.update({
      where: { id: fulfillmentId },
      data: { confirmationToken: otp },
    });

    // 3. Generate and save Invoice & Delivery Note
    await Promise.all([
      this.generateAndSaveInvoice(transactionId, organizationId, memberId),
      (async () => {
        const dnData = Mappers.toDeliveryNoteData(transaction, fulfillment);
        const dnStream = await DocumentGenerator.renderToStream(
          React.createElement(DeliveryNoteDocument, { data: dnData }),
        );
        const dnBuffer = await this.streamToBuffer(dnStream);
        const dnFileName = `delivery-note-${transaction.number}-${Date.now()}.pdf`;
        const dnUpload = await storageService.upload(
          dnBuffer,
          dnFileName,
          "application/pdf",
          { organizationId },
        );
        const { StorageCoreService } = await import("../../storage");
        const { shortCode, shortUrl } =
          StorageCoreService.generateShortUrlInfo();

        await db.attachment.create({
          data: {
            organizationId,
            memberId,
            transactionId,
            fulfillmentId,
            fileName: dnUpload.id, // Store the final storage ID/filename
            fileUrl: dnUpload.url,
            shortCode,
            shortUrl,
            mimeType: "application/pdf",
            isPublic: true,
            description: "Auto-generated Delivery Note",
            sizeBytes: dnBuffer.length,
          },
        });
      })(),
    ]);

    // 4. Send OTP to customer if they have contact info
    if (transaction.customer?.email) {
      try {
        await notificationEngine.notify({
          organizationId,
          templateName: "DELIVERY_OTP",
          data: {
            otp,
            customerName: transaction.customer.name,
            orderNumber: transaction.number,
          },
          recipients: {
            userIds: (transaction.customer as any).userId
              ? [(transaction.customer as any).userId]
              : [],
          },
          channels: ["EMAIL"],
        });
      } catch (e) {
        console.error("Failed to send OTP email:", e);
      }
    }

    return { otp };
  }

  /**
   * Generates and saves an Invoice for a transaction.
   */
  async generateAndSaveInvoice(
    transactionId: string,
    organizationId: string,
    memberId: string | null,
  ) {
    let effectiveMemberId = memberId;

    if (!effectiveMemberId) {
      const firstMember = await db.member.findFirst({
        where: { organizationId, role: "OWNER" },
        select: { id: true },
      });
      effectiveMemberId = firstMember?.id || null;
    }

    if (!effectiveMemberId) {
      throw new Error("No valid member found to associate with the document");
    }

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId, organizationId },
      include: {
        items: true,
        customer: { include: { addresses: true } },
        organization: {
          include: {
            settings: true,
            invoiceConfig: true,
          },
        },
        location: true,
        payments: true,
        member: { include: { user: { select: { name: true } } } },
      },
    });

    if (!transaction) throw new Error("Transaction not found");

    const templateId = transaction.organization?.settings?.defaultInvoiceTemplate;

    let stream;
    let qrCode = "";
    try {
      qrCode = await QRCode.toDataURL(transaction.number);
    } catch (err) {
      console.error("Failed to generate QR code", err);
    }

    if (isV3Template(templateId)) {
      const template = getTemplateById(templateId!);
      if (!template) throw new Error(`Template not found: ${templateId}`);

      const documentData = Mappers.toV3DocumentData(transaction as any, "invoice");
      stream = await DocumentGenerator.renderToStream(
        React.createElement(template.component, { data: documentData, qrCode }),
      );
    } else {
      const DocumentComponent = getInvoiceTemplate(templateId);
      const documentData = Mappers.toInvoiceData(transaction as any);
      stream = await DocumentGenerator.renderToStream(
        React.createElement(DocumentComponent, { data: documentData, qrCode }),
      );
    }
    const buffer = await this.streamToBuffer(stream);

    const fileName = `invoice-${transaction.number}-${Date.now()}.pdf`;
    const upload = await storageService.upload(
      buffer,
      fileName,
      "application/pdf",
      { organizationId },
    );

    const { StorageCoreService } = await import("../../storage");
    const { shortCode, shortUrl } = StorageCoreService.generateShortUrlInfo();

    return await db.attachment.create({
      data: {
        organizationId,
        memberId: effectiveMemberId,
        transactionId,
        fileName: upload.id, // Store the final storage ID/filename
        fileUrl: upload.url,
        shortCode,
        shortUrl,
        mimeType: "application/pdf",
        isPublic: true,
        description: "Invoice",
        sizeBytes: buffer.length,
      },
    });
  }

  /**
   * Generates and saves a Receipt for a transaction.
   */
  async generateAndSaveReceipt(
    transactionId: string,
    organizationId: string,
    memberId: string | null,
  ) {
    let effectiveMemberId = memberId;

    if (!effectiveMemberId) {
      const firstMember = await db.member.findFirst({
        where: { organizationId, role: "OWNER" },
        select: { id: true },
      });
      effectiveMemberId = firstMember?.id || null;
    }

    if (!effectiveMemberId) {
      throw new Error("No valid member found to associate with the document");
    }

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId, organizationId },
      include: {
        items: true,
        customer: { include: { addresses: true } },
        organization: {
          include: {
            settings: true,
            receiptConfig: true,
          },
        },
        location: true,
        payments: true,
        member: { include: { user: { select: { name: true } } } },
      },
    });

    if (!transaction) throw new Error("Transaction not found");

    const templateId = transaction.organization?.settings?.defaultReceiptTemplate;

    let stream;
    let qrCode = "";
    try {
      qrCode = await QRCode.toDataURL(transaction.number);
    } catch (err) {
      console.error("Failed to generate QR code", err);
    }

    if (isV3Template(templateId)) {
      const template = getTemplateById(templateId!);
      if (!template) throw new Error(`Template not found: ${templateId}`);

      const documentData = Mappers.toV3DocumentData(transaction as any, "receipt");
      stream = await DocumentGenerator.renderToStream(
        React.createElement(template.component, { data: documentData, qrCode }),
      );
    } else {
      const documentData = Mappers.toReceiptData(transaction as any);
      stream = await DocumentGenerator.renderToStream(
        React.createElement(ReceiptTemplateV2, { data: documentData }),
      );
    }
    const buffer = await this.streamToBuffer(stream);

    const fileName = `receipt-${transaction.number}-${Date.now()}.pdf`;
    const upload = await storageService.upload(
      buffer,
      fileName,
      "application/pdf",
      { organizationId },
    );

    const { StorageCoreService } = await import("../../storage");
    const { shortCode, shortUrl } = StorageCoreService.generateShortUrlInfo();

    return await db.attachment.create({
      data: {
        organizationId,
        memberId: effectiveMemberId,
        transactionId,
        fileName: upload.id, // Store the final storage ID/filename
        fileUrl: upload.url,
        shortCode,
        shortUrl,
        mimeType: "application/pdf",
        isPublic: true,
        description: "Receipt",
        sizeBytes: buffer.length,
      },
    });
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: any[] = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}

export const documentService = new DocumentService();
