import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SchemaService } from '../schema.service';

describe('SchemaService', () => {
  let mockPrisma: any;
  let service: SchemaService;

  beforeEach(() => {
    mockPrisma = {
      crmObjectDefinition: {
        upsert: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      crmFieldDefinition: {
        upsert: vi.fn(),
      },
      crmRelationshipDefinition: {
        upsert: vi.fn(),
      },
    };
    service = new SchemaService(mockPrisma);
  });

  describe('seedStandardObjects', () => {
    it('should parallelize object creation, field creation, and relationship upserts', async () => {
      const orgId = 'org_test_123';

      mockPrisma.crmObjectDefinition.upsert.mockImplementation((params: any) => {
        const name = params.create.name;
        return Promise.resolve({
          id: `obj_${name}_id`,
          name,
          organizationId: orgId,
          label: params.create.label,
          labelPlural: params.create.labelPlural,
          isSystem: true,
        });
      });

      mockPrisma.crmObjectDefinition.findUnique.mockResolvedValue(null);

      mockPrisma.crmFieldDefinition.upsert.mockImplementation((params: any) => {
        return Promise.resolve({
          id: `field_${params.create.name}_id`,
          objectId: params.create.objectId,
          name: params.create.name,
        });
      });

      mockPrisma.crmRelationshipDefinition.upsert.mockImplementation((params: any) => {
        return Promise.resolve({
          id: `rel_${params.create.name}_id`,
          name: params.create.name,
        });
      });

      const result = await service.seedStandardObjects(orgId);

      // Verify the returned standard objects
      expect(result.person).toBeDefined();
      expect(result.person.id).toBe('obj_person_id');
      expect(result.company).toBeDefined();
      expect(result.company.id).toBe('obj_company_id');
      expect(result.lead).toBeDefined();
      expect(result.lead.id).toBe('obj_lead_id');
      expect(result.deal).toBeDefined();
      expect(result.deal.id).toBe('obj_deal_id');

      // Verify crmObjectDefinition.upsert was called 4 times for standard objects
      expect(mockPrisma.crmObjectDefinition.upsert).toHaveBeenCalledTimes(4);

      // Verify crmFieldDefinition.upsert was called 20 times for all fields across standard objects
      expect(mockPrisma.crmFieldDefinition.upsert).toHaveBeenCalledTimes(20);

      // Verify crmRelationshipDefinition.upsert was called 3 times for standard relationships
      expect(mockPrisma.crmRelationshipDefinition.upsert).toHaveBeenCalledTimes(3);
    });
  });
});
