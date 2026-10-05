import { s3Storage } from '@payloadcms/storage-s3';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

import { Tenants } from './collections/Tenants';
import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Products } from './collections/Products';
import { Campaigns } from './collections/Campaigns';
import { Pages } from './collections/Pages';
import { Banners } from './collections/Banners';
import { Testimonials } from './collections/Testimonials';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const rustfsEndpoint = process.env.RUSTFS_ENDPOINT || 'http://localhost:9000';
const rustfsBucket = process.env.RUSTFS_BUCKET || 'dealio-uploads';
const rustfsAccessKey = process.env.RUSTFS_ACCESS_KEY || 'your-access-key';
const rustfsSecretKey = process.env.RUSTFS_SECRET_KEY || 'your-secret-key';
const rustfsRegion = process.env.RUSTFS_REGION || 'us-east-1';

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  sharp,
  collections: [
    Tenants,
    Users,
    Media,
    Products,
    Campaigns,
    Pages,
    Banners,
    Testimonials,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'scryme-cms-secret-key-must-be-32-chars-long',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgresql://dbuser:dbpassword@localhost:5432/app_db?schema=public',
    },
    push: process.env.PAYLOAD_DB_PUSH === 'true' || process.env.NODE_ENV !== 'production',
  }),
  plugins: [
    s3Storage({
      collections: {
        media: {
          generateFileURL: ({ filename, prefix }) => {
            const publicUrlBase = process.env.RUSTFS_PUBLIC_URL || rustfsEndpoint;
            const key = prefix ? `${prefix}/${filename}` : filename;
            return `${publicUrlBase}/${rustfsBucket}/${key}`;
          },
        },
      },
      bucket: rustfsBucket,
      config: {
        endpoint: rustfsEndpoint,
        credentials: {
          accessKeyId: rustfsAccessKey,
          secretAccessKey: rustfsSecretKey,
        },
        region: rustfsRegion,
        forcePathStyle: true,
      },
    }),
  ],
});
