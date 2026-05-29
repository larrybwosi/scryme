import { MpesaClient } from '../client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MpesaClient', () => {
  const credentials = {
    mpesaShortCode: '174379',
    mpesaType: 'PAYBILL' as const,
    mpesaConsumerKey: 'key',
    mpesaConsumerSecret: 'secret',
    mpesaPassKey: 'passkey',
    environment: 'SANDBOX' as const,
  };

  const client = new MpesaClient(credentials);

  it('should get access token', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { access_token: 'test_token' } });
    const token = await client.getAccessToken();
    expect(token).toBe('test_token');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/oauth/v1/generate'),
      expect.any(Object)
    );
  });

  it('should initiate STK Push', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { access_token: 'test_token' } });
    mockedAxios.post.mockResolvedValueOnce({ data: { MerchantRequestID: '123' } });

    const response = await client.initiateSTKPush({
      phoneNumber: '254712345678',
      amount: 100,
      callbackUrl: 'http://callback.com',
      accountReference: 'Ref',
      transactionDesc: 'Desc',
    });

    expect(response.MerchantRequestID).toBe('123');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/mpesa/stkpush/v1/processrequest'),
      expect.any(Object),
      expect.any(Object)
    );
  });
});
