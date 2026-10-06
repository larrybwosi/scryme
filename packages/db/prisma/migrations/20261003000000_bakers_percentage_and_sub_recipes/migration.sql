-- AlterTable recipe_ingredient to make ingredientVariantId optional, add subRecipeId, isFlour, and bakersPercentage
ALTER TABLE "recipe_ingredient" ALTER COLUMN "ingredientVariantId" DROP NOT NULL;

ALTER TABLE "recipe_ingredient"
ADD COLUMN IF NOT EXISTS "subRecipeId" TEXT,
ADD COLUMN IF NOT EXISTS "isFlour" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "bakersPercentage" DECIMAL(8,2);

-- Drop unique constraint if existing because sub-recipes don't have ingredientVariantId
ALTER TABLE "recipe_ingredient" DROP CONSTRAINT IF EXISTS "recipe_ingredient_recipeId_ingredientVariantId_systemUnitId_key";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recipe_ingredient_subRecipeId_idx" ON "recipe_ingredient"("subRecipeId");

-- AddForeignKey Constraint for subRecipeId
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_ingredient_subRecipeId_fkey') THEN
        ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_subRecipeId_fkey" FOREIGN KEY ("subRecipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
