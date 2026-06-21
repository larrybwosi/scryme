import React, { Suspense } from "react";
import { getCategoriesFull } from "../../actions/inventory";
import { CategoryTable } from "../../../components/inventory/category-table";
import { Button } from "@repo/ui/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryDialog } from "../../../components/inventory/category-dialog";

export default async function CategoriesPage() {
  const categories = await getCategoriesFull();

  return (
    <Suspense>
      <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">
              Product Categories
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your product organization and taxonomy.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CategoryDialog>
              <Button className="gap-2">
                <Plus size={16} />
                <span>Add Category</span>
              </Button>
            </CategoryDialog>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <CategoryTable data={categories} />
        </div>
      </div>
    </Suspense>
  );
}
