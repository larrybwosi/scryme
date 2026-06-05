import { ScrymeClient } from '../../core/client';

export abstract class BaseModule {
  constructor(protected readonly client: ScrymeClient) {}

  protected getOrgPath(path: string): string {
    const orgSlug = this.client.getOrgSlug();
    if (!orgSlug) {
      throw new Error('Organization slug is required for V3 API calls. Set it during initialization.');
    }
    return `/v3/${orgSlug}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
