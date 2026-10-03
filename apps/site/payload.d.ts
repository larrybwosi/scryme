declare module 'payload' {
  export function buildConfig(config: any): any
}
declare module '@payloadcms/db-postgres' {
  export function postgresAdapter(options: any): any
}
declare module '@payloadcms/richtext-lexical' {
  export function lexicalEditor(): any
}
declare module '@payloadcms/next/routes' {
  export const REST_GET: any
  export const REST_POST: any
  export const REST_DELETE: any
  export const REST_PATCH: any
  export const REST_OPTIONS: any
}
