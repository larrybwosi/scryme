/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import config from '@payload-config';
import { generatePageMetadata, RootPage } from '@payloadcms/next/views';
import { importMap } from '../../importMap';

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams });

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap });

export default Page;
