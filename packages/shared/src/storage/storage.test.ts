import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RustfsStorageProvider } from './rustfs.provider';
import { SanityStorageProvider } from './sanity.provider';
import { StorageService } from './storage.service';
import * as S3 from '@aws-sdk/client-s3';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: vi.fn().mockImplementation(function() {
      return {
        send: vi.fn().mockResolvedValue({}),
      };
    }),
    PutObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    CreateMultipartUploadCommand: vi.fn().mockImplementation(() => ({})),
    UploadPartCommand: vi.fn().mockImplementation(() => ({})),
    CompleteMultipartUploadCommand: vi.fn().mockImplementation(() => ({})),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: vi.fn().mockResolvedValue('https://mock-signed-url.com'),
  };
});

// Mock Sanity Client
vi.mock('@sanity/client', () => {
  return {
    createClient: vi.fn(() => ({
      assets: {
        upload: vi.fn().mockResolvedValue({
          _id: 'mock-id',
          url: 'https://mock-sanity-url.com/file.pdf',
        }),
      },
      delete: vi.fn().mockResolvedValue({}),
    })),
  };
});

describe('Storage Providers', () => {
  const mockFile = Buffer.from('test content');
  const filename = 'test.pdf';
  const contentType = 'application/pdf';

  describe('RustfsStorageProvider', () => {
    beforeEach(() => {
      vi.stubEnv('RUSTFS_ENDPOINT', 'http://localhost:9000');
      vi.stubEnv('RUSTFS_ACCESS_KEY', 'access-key');
      vi.stubEnv('RUSTFS_SECRET_KEY', 'secret-key');
      vi.clearAllMocks();
    });

    it('should upload a file correctly', async () => {
      const provider = new RustfsStorageProvider();
      const result = await provider.upload(mockFile, filename, contentType);

      expect(result).toEqual({
        url: 'http://localhost:9000/dealio-uploads/test.pdf',
        id: 'test.pdf',
      });
      expect(S3.S3Client).toHaveBeenCalled();
    });

    it('should handle custom bucket name', async () => {
      vi.stubEnv('RUSTFS_BUCKET', 'custom-bucket');
      const provider = new RustfsStorageProvider();
      const result = await provider.upload(mockFile, filename, contentType);

      expect(result.url).toContain('custom-bucket');
    });
  });

  describe('SanityStorageProvider', () => {
    beforeEach(() => {
      vi.stubEnv('SANITY_PROJECT_ID', 'project-id');
      vi.stubEnv('SANITY_DATASET', 'dataset');
      vi.stubEnv('SANITY_API_TOKEN', 'token');
      vi.clearAllMocks();
    });

    it('should upload a file correctly', async () => {
      const provider = new SanityStorageProvider();
      const result = await provider.upload(mockFile, filename, contentType, { uploadAsFile: true });

      expect(result.id).toBe('mock-id');
      expect(result.url).toBe('https://mock-sanity-url.com/file.pdf');
    });

    it('should upload an image with webp transformations by default', async () => {
        const provider = new SanityStorageProvider();
        const result = await provider.upload(mockFile, 'image.png', 'image/png');

        expect(result.url).toContain('fm=webp');
    });
  });

  describe('StorageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should use rustfs when configured', async () => {
      vi.stubEnv('STORAGE_PROVIDER', 'rustfs');
      vi.stubEnv('RUSTFS_ENDPOINT', 'http://localhost:9000');
      vi.stubEnv('RUSTFS_ACCESS_KEY', 'access-key');
      vi.stubEnv('RUSTFS_SECRET_KEY', 'secret-key');

      const service = new StorageService();
      const result = await service.upload(mockFile, filename, contentType);

      expect(result.id).toBe(`dealio-${filename}`);
    });

    it('should use sanity by default', async () => {
      vi.stubEnv('STORAGE_PROVIDER', 'sanity');
      vi.stubEnv('SANITY_PROJECT_ID', 'project-id');
      vi.stubEnv('SANITY_DATASET', 'dataset');
      vi.stubEnv('SANITY_API_TOKEN', 'token');

      const service = new StorageService();
      const result = await service.upload(mockFile, filename, contentType);

      expect(result.id).toBe('mock-id');
    });

    it('should always prepend dealio- to filename if not present', async () => {
        vi.stubEnv('STORAGE_PROVIDER', 'rustfs');
        vi.stubEnv('RUSTFS_ENDPOINT', 'http://localhost:9000');
        vi.stubEnv('RUSTFS_ACCESS_KEY', 'access-key');
        vi.stubEnv('RUSTFS_SECRET_KEY', 'secret-key');

        const service = new StorageService();

        // Test without prefix
        const res1 = await service.upload(mockFile, 'file1.txt', 'text/plain');
        expect(res1.id).toBe('dealio-file1.txt');

        // Test with prefix
        const res2 = await service.upload(mockFile, 'dealio-file2.txt', 'text/plain');
        expect(res2.id).toBe('dealio-file2.txt');
    });
  });
});
