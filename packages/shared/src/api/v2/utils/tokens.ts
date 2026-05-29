import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

const getSecret = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

// --- QR Utils ---

interface QRPayload {
  transactionId: string;
  organizationId: string;
}

export async function generateTransactionQR(transactionId: string, organizationId: string): Promise<string> {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) throw new Error('QR_SIGNING_SECRET is not set');
  const payload: QRPayload = { transactionId, organizationId };
  const token = jwt.sign(payload, secret, { expiresIn: '24h' });

  try {
    const dataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
}

export function verifyQRToken(token: string): QRPayload | null {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) throw new Error('QR_SIGNING_SECRET is not set');
  try {
    const decoded = jwt.verify(token, secret) as QRPayload;
    return decoded;
  } catch (err) {
    console.error('Invalid or expired QR token:', err);
    return null;
  }
}

// --- Document Token Utils ---

interface DocumentTokenPayload {
  type: string;
  id: string;
  orgId: string;
  sub: string;
  iss: string;
  iat: number;
  exp: number;
}

function getDocumentJwtSecret(): string {
  const secret = process.env.DOCUMENT_SIGNING_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('DOCUMENT_SIGNING_SECRET or JWT_SECRET is not set');
  }
  return secret;
}

export function generateDocumentToken(
  type: 'invoice' | 'waybill' | 'receipt' | 'quote',
  id: string,
  organizationId: string,
  expiresIn: string | number = '24h'
): string {
  try {
    const payload = {
      type,
      id,
      orgId: organizationId,
      sub: id,
      iss: 'dealio-v2-api',
    };

    return jwt.sign(payload, getDocumentJwtSecret(), { expiresIn: expiresIn as any, algorithm: 'HS256' });
  } catch (error) {
    console.error('Failed to sign document token', error);
    throw new Error('Failed to generate document token');
  }
}

export function verifyDocumentToken(token: string): DocumentTokenPayload | null {
  try {
    const payload = jwt.verify(token, getDocumentJwtSecret(), { algorithms: ['HS256'] }) as DocumentTokenPayload;

    if (payload.iss !== 'dealio-v2-api') {
      console.warn('Invalid token issuer', { issuer: payload.iss });
      return null;
    }

    return payload;
  } catch (error) {
    console.warn('Invalid or expired document token', error);
    return null;
  }
}

export function getDocumentUrl(
  type: 'invoice' | 'waybill' | 'receipt' | 'quote',
  id: string,
  organizationId: string,
  baseUrl?: string
): string {
  const token = generateDocumentToken(type, id, organizationId);
  const effectiveBaseUrl = baseUrl || getSecret('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  return `${effectiveBaseUrl}/api/v2/public/documents/${type}/${id}?token=${token}`;
}

export { formatVariantDisplayName } from './client/formatting';
