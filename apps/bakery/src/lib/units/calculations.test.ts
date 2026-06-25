import { describe, it, expect } from 'vitest';
import {
  calculateLineQuantity,
  calculateLineUnitCost,
  calculateLineTotal,
  calculateGrandTotal
} from './calculations';

describe('Bakery Unit Conversion Logic', () => {
  describe('calculateLineQuantity', () => {
    it('should calculate quantity correctly for containers', () => {
      const line = {
        useContainer: true,
        numContainers: 10,
        unitsPerContainer: 25,
      };
      expect(calculateLineQuantity(line)).toBe(250);
    });

    it('should return base quantity when not using containers', () => {
      const line = {
        useContainer: false,
        quantity: 100,
      };
      expect(calculateLineQuantity(line)).toBe(100);
    });

    it('should handle missing values with defaults', () => {
      expect(calculateLineQuantity({ useContainer: true })).toBe(0);
      expect(calculateLineQuantity({})).toBe(0);
    });
  });

  describe('calculateLineUnitCost', () => {
    it('should calculate unit cost correctly for containers', () => {
      const line = {
        useContainer: true,
        pricePerContainer: 50,
        unitsPerContainer: 25,
      };
      expect(calculateLineUnitCost(line)).toBe(2);
    });

    it('should return base unit cost when not using containers', () => {
      const line = {
        useContainer: false,
        unitCost: 1.5,
      };
      expect(calculateLineUnitCost(line)).toBe(1.5);
    });

    it('should handle zero units per container to avoid division by zero', () => {
      const line = {
        useContainer: true,
        pricePerContainer: 50,
        unitsPerContainer: 0,
      };
      expect(calculateLineUnitCost(line)).toBe(0);
    });
  });

  describe('calculateLineTotal', () => {
    it('should calculate total correctly for containers', () => {
      const line = {
        useContainer: true,
        numContainers: 10,
        pricePerContainer: 50,
      };
      expect(calculateLineTotal(line)).toBe(500);
    });

    it('should calculate total correctly for base units', () => {
      const line = {
        useContainer: false,
        quantity: 10,
        unitCost: 5,
      };
      expect(calculateLineTotal(line)).toBe(50);
    });
  });

  describe('calculateGrandTotal', () => {
    it('should sum up multiple lines correctly', () => {
      const lines = [
        { useContainer: true, numContainers: 2, pricePerContainer: 100 },
        { useContainer: false, quantity: 50, unitCost: 2 },
      ];
      expect(calculateGrandTotal(lines)).toBe(300);
    });

    it('should return 0 for empty or null lines', () => {
      expect(calculateGrandTotal([])).toBe(0);
      expect(calculateGrandTotal(null as any)).toBe(0);
    });
  });
});
