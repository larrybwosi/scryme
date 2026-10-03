import { PrismaClient } from '@repo/db'

export interface MarketingPageData {
  id?: string
  organizationId: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  heroHeader?: string
  heroSubheader?: string
  content?: any
  featuredProducts?: any
  seoTitle?: string
  seoDescription?: string
}

export interface ProductCampaignData {
  id?: string
  organizationId: string
  campaignName: string
  bannerHeadline: string
  callToActionUrl?: string
  callToActionText?: string
  discountCode?: string
  activeFrom?: Date
  activeUntil?: Date
  status: 'scheduled' | 'active' | 'paused' | 'expired'
}

/**
 * Multi-tenant Organization Product Marketing Service
 * Provides helper functions for managing and querying organization product marketing
 * campaign assets, landing pages, and promotional media while enforcing strict BOLA/tenant isolation.
 */
export class MarketingCmsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Helper to format tenant marketing campaign metadata
   */
  public formatCampaignData(organizationId: string, campaign: ProductCampaignData) {
    if (!campaign.organizationId || campaign.organizationId !== organizationId) {
      throw new Error('Tenant isolation mismatch: Campaign organization ID does not match session organization.')
    }
    return {
      ...campaign,
      organizationId,
      isCurrentlyActive:
        campaign.status === 'active' &&
        (!campaign.activeUntil || new Date(campaign.activeUntil) >= new Date()),
    }
  }

  /**
   * Validates tenant isolation for marketing page mutations
   */
  public validatePageTenantAccess(sessionOrgId: string, pageOrgId: string): boolean {
    if (!sessionOrgId || sessionOrgId !== pageOrgId) {
      throw new Error(`Unauthorized tenant access attempt. Required org: ${sessionOrgId}, target org: ${pageOrgId}`)
    }
    return true
  }

  /**
   * Builds standardized SEO metadata for organization product marketing pages
   */
  public buildMarketingSeoMetadata(page: MarketingPageData, orgName: string) {
    return {
      title: page.seoTitle || `${page.title} | ${orgName}`,
      description: page.seoDescription || page.heroSubheader || `Explore ${page.title} products from ${orgName}.`,
      openGraph: {
        title: page.seoTitle || page.title,
        description: page.seoDescription || page.heroSubheader,
        type: 'website',
      },
    }
  }
}
