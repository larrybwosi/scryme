// types/template.ts
export interface Template {
  id: string;
  name: string;
  description?: string;
  recipeId: string;
  batchSize: number;
  ingredients: TemplateIngredient[];
  instructions?: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateIngredient {
  stockItemId: string;
  quantity: number;
  unit: string;
  scaleable: boolean;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  recipeId: string;
  batchSize: number;
  ingredients: TemplateIngredient[];
  instructions?: string[];
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;
