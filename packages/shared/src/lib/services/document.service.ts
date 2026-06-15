import { DocumentGenerator, Mappers, SimpleInvoicePDF, DeliveryNoteDocument } from "@repo/documents/server";
import { storageService } from "../../storage";
import { db } from "@repo/db";
import { notificationEngine } from "@repo/notifications";
import React from "react";

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
                invoiceConfig: true
            }
        },
        location: true,
        payments: true,
        fulfillments: {
            where: { id: fulfillmentId },
            include: { shippingAddress: true }
        }
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

    // 3. Prepare Data for Documents
    const invoiceData = Mappers.toInvoiceData(transaction);
    const dnData = Mappers.toDeliveryNoteData(transaction, fulfillment);

    // 4. Generate PDFs
    const invoiceStream = await DocumentGenerator.renderToStream(
      React.createElement(SimpleInvoicePDF, { data: invoiceData })
    );
    const dnStream = await DocumentGenerator.renderToStream(
      React.createElement(DeliveryNoteDocument, { data: dnData })
    );

    // Convert streams to Buffers for storage upload
    const invoiceBuffer = await this.streamToBuffer(invoiceStream);
    const dnBuffer = await this.streamToBuffer(dnStream);

    // 5. Upload to Storage
    const invoiceFileName = `invoice-${transaction.number}.pdf`;
    const dnFileName = `delivery-note-${transaction.number}.pdf`;

    const [invoiceUpload, dnUpload] = await Promise.all([
      storageService.upload(invoiceBuffer, invoiceFileName, "application/pdf"),
      storageService.upload(dnBuffer, dnFileName, "application/pdf"),
    ]);

    // 6. Create Attachments
    await db.attachment.createMany({
      data: [
        {
          organizationId,
          memberId,
          transactionId,
          fulfillmentId,
          fileName: invoiceFileName,
          fileUrl: invoiceUpload.url || (invoiceUpload as any).publicUrl,
          mimeType: "application/pdf",
          description: "Auto-generated Invoice",
          sizeBytes: invoiceBuffer.length,
        },
        {
          organizationId,
          memberId,
          transactionId,
          fulfillmentId,
          fileName: dnFileName,
          fileUrl: dnUpload.url || (dnUpload as any).publicUrl,
          mimeType: "application/pdf",
          description: "Auto-generated Delivery Note",
          sizeBytes: dnBuffer.length,
        },
      ],
    });

    // 7. Send OTP to customer if they have contact info
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
                    userIds: (transaction.customer as any).userId ? [(transaction.customer as any).userId] : []
                },
                channels: ["EMAIL"]
            });
        } catch (e) {
            console.error("Failed to send OTP email:", e);
        }
    }

    return { otp, invoiceUrl: invoiceUpload.url, dnUrl: dnUpload.url };
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
