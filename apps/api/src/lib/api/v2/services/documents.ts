export async function generateDocument(type: string, data: any): Promise<any> {
  return Buffer.from([]);
}

export async function getDocumentStream(type: any, id: string, orgId?: string, format?: any, template?: string): Promise<any> {
    return null;
}

export enum DocumentType {
    INVOICE = 'INVOICE',
    RECEIPT = 'RECEIPT',
}

export enum DocumentFormat {
    PDF = 'PDF',
    HTML = 'HTML',
}
