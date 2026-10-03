import { describe, it, expect, vi } from 'vitest'
import { MarketingCmsService, ProductCampaignData, MarketingPageData } from '../services/marketing-cms.service'

describe('MarketingCmsService (Multi-Tenant Isolation)', () => {
  const mockPrisma = {} as any
  const service = new MarketingCmsService(mockPrisma)

  it('correctly validates tenant access when organization IDs match', () => {
    const sessionOrgId = 'org_12345'
    const pageOrgId = 'org_12345'
    expect(service.validatePageTenantAccess(sessionOrgId, pageOrgId)).toBe(true)
  })

  it('throws an error when tenant organization IDs mismatch (BOLA protection)', () => {
    const sessionOrgId = 'org_12345'
    const targetOrgId = 'org_67890'
    expect(() => service.validatePageTenantAccess(sessionOrgId, targetOrgId)).toThrow(
      'Unauthorized tenant access attempt'
    )
  })

  it('formats campaign data and calculates activity status correctly', () => {
    const orgId = 'org_abc'
    const activeCampaign: ProductCampaignData = {
      organizationId: orgId,
      campaignName: 'Summer Bakery Promo',
      bannerHeadline: '20% off all artisanal loaves',
      status: 'active',
      activeUntil: new Date(Date.now() + 86400000), // tomorrow
    }

    const formatted = service.formatCampaignData(orgId, activeCampaign)
    expect(formatted.organizationId).toBe(orgId)
    expect(formatted.isCurrentlyActive).toBe(true)
  })

  it('rejects campaign formatting if organization ID does not match target', () => {
    const sessionOrgId = 'org_abc'
    const rogueCampaign: ProductCampaignData = {
      organizationId: 'org_xyz',
      campaignName: 'Unauthorized Promo',
      bannerHeadline: 'Free Items',
      status: 'active',
    }

    expect(() => service.formatCampaignData(sessionOrgId, rogueCampaign)).toThrow(
      'Tenant isolation mismatch'
    )
  })

  it('builds SEO metadata with organization branding fallback', () => {
    const page: MarketingPageData = {
      organizationId: 'org_123',
      title: 'Artisanal Sourdough Showcase',
      slug: 'artisanal-sourdough',
      status: 'published',
      heroSubheader: 'Hand-crafted fresh daily.',
    }

    const seo = service.buildMarketingSeoMetadata(page, 'Scryme Bakery')
    expect(seo.title).toBe('Artisanal Sourdough Showcase | Scryme Bakery')
    expect(seo.description).toBe('Hand-crafted fresh daily.')
    expect(seo.openGraph.title).toBe('Artisanal Sourdough Showcase')
  })
})
