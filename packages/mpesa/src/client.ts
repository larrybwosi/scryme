import axios from 'axios';
import { MpesaCredentials, STKPushResponse, STKQueryResponse, C2BRegistrationResponse } from './types';

export class MpesaClient {
  private baseUrl: string;

  constructor(private credentials: MpesaCredentials) {
    this.baseUrl =
      credentials.environment === 'PRODUCTION' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  }

  async getAccessToken(): Promise<string> {
    const authString = Buffer.from(
      `${this.credentials.mpesaConsumerKey}:${this.credentials.mpesaConsumerSecret}`
    ).toString('base64');

    try {
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${authString}` },
        timeout: 10000,
        maxContentLength: 1024 * 1024, // 1MB
      });
      return response.data.access_token;
    } catch (error: any) {
      console.error('M-Pesa Auth Error:', error?.response?.data || error.message);
      throw new Error('Failed to obtain M-Pesa access token');
    }
  }

  async initiateSTKPush(params: {
    phoneNumber: string;
    amount: number;
    callbackUrl: string;
    accountReference: string;
    transactionDesc: string;
  }): Promise<STKPushResponse> {
    const token = await this.getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);

    if (!this.credentials.mpesaPassKey) {
      throw new Error('M-Pesa PassKey is required for STK Push');
    }

    const password = Buffer.from(
      `${this.credentials.mpesaShortCode}${this.credentials.mpesaPassKey}${timestamp}`
    ).toString('base64');

    const commandId = this.credentials.mpesaType === 'TILL' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.credentials.mpesaShortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: commandId,
          Amount: Math.floor(params.amount),
          PartyA: params.phoneNumber,
          PartyB: this.credentials.mpesaShortCode,
          PhoneNumber: params.phoneNumber,
          CallBackURL: params.callbackUrl,
          AccountReference: params.accountReference,
          TransactionDesc: params.transactionDesc,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
          maxContentLength: 1024 * 1024, // 1MB
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('M-Pesa STK Push Error:', error?.response?.data || error.message);
      throw error;
    }
  }

  async querySTKStatus(checkoutRequestId: string): Promise<STKQueryResponse> {
    const token = await this.getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);

    if (!this.credentials.mpesaPassKey) {
      throw new Error('M-Pesa PassKey is required for STK Query');
    }

    const password = Buffer.from(
      `${this.credentials.mpesaShortCode}${this.credentials.mpesaPassKey}${timestamp}`
    ).toString('base64');

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.credentials.mpesaShortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
          maxContentLength: 1024 * 1024, // 1MB
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('M-Pesa STK Query Error:', error?.response?.data || error.message);
      throw error;
    }
  }

  async registerC2BUrls(params: {
    validationUrl: string;
    confirmationUrl: string;
    responseType?: 'Completed' | 'Cancelled';
  }): Promise<C2BRegistrationResponse> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/c2b/v1/registerurl`,
        {
          ShortCode: this.credentials.mpesaShortCode,
          ResponseType: params.responseType || 'Completed',
          ConfirmationURL: params.confirmationUrl,
          ValidationURL: params.validationUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
          maxContentLength: 1024 * 1024, // 1MB
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('M-Pesa C2B Registration Error:', error?.response?.data || error.message);
      throw error;
    }
  }
}
