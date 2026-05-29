import { StorageProvider } from './types';
import { SanityStorageProvider } from './sanity.provider';
import { MinioStorageProvider } from './minio.provider';

export class StorageService implements StorageProvider {
  private provider: StorageProvider;

  constructor() {
    const providerType = process.env.STORAGE_PROVIDER || 'sanity';

    if (providerType === 'minio') {
      this.provider = new MinioStorageProvider();
    } else {
      this.provider = new SanityStorageProvider();
    }
  }

  async upload(file: Buffer, filename: string, contentType: string, options?: { uploadAsFile?: boolean }) {
    // Ensure dealio- prefix as requested
    const finalFilename = filename.startsWith('dealio-') ? filename : `dealio-${filename}`;
    return this.provider.upload(file, finalFilename, contentType, options);
  }

  async delete(id: string) {
    return this.provider.delete(id);
  }
}

export const storageService = new StorageService();
