import { getSDK } from '../index';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SDK Interceptor', () => {
  let sdk: any;
  let interceptor: any;

  beforeEach(() => {
    mockedAxios.create.mockReturnValue({
      interceptors: {
        response: { use: jest.fn((success) => { interceptor = success; }) },
      },
      defaults: { headers: { common: {} } },
    } as any);

    sdk = getSDK({ baseURL: 'http://api.test' });
  });

  it('should unwrap standard response with timestamp', () => {
    const response = {
      data: {
        success: true,
        data: [{ id: 1 }],
        timestamp: '2023-01-01T00:00:00Z',
      },
    };

    const result = interceptor(response);
    expect(result.data).toEqual([{ id: 1 }]);
  });

  it('should preserve metadata when unwrapping', () => {
    const response = {
      data: {
        success: true,
        data: [{ id: 1 }],
        meta: { total: 1 },
      },
    };

    const result = interceptor(response);
    expect(result.data).toEqual({
      data: [{ id: 1 }],
      metadata: { total: 1 },
    });
  });

  it('should handle metadata key as "metadata"', () => {
    const response = {
      data: {
        success: true,
        data: [{ id: 1 }],
        metadata: { total: 1 },
      },
    };

    const result = interceptor(response);
    expect(result.data).toEqual({
      data: [{ id: 1 }],
      metadata: { total: 1 },
    });
  });

  it('should not unwrap if success is false', () => {
    const response = {
      data: {
        success: false,
        data: { error: 'failed' },
      },
    };

    const result = interceptor(response);
    expect(result.data).toEqual({
      success: false,
      data: { error: 'failed' },
    });
  });

  it('should return original response if it does not match standard format', () => {
    const response = {
      data: [{ id: 1 }],
    };

    const result = interceptor(response);
    expect(result).toEqual(response);
  });
});
