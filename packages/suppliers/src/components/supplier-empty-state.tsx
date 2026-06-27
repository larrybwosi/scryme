import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Plus, Building, Truck, Package, BarChart3, Users } from "lucide-react";
import Link from "next/link";

export function SupplierEmptyState() {
  return (
    <>
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <Building className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Plus className="h-6 w-6 text-foreground" />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">
          No Suppliers Yet
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Get started by adding your first supplier. Manage relationships, track
          deliveries, and monitor performance all in one place.
        </p>

        <Link href="/suppliers?create=true">
          <Button className="mb-8" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create First Supplier
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          <Card className="bg-muted/50">
            <CardHeader className="p-4 pb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-sm">Track Deliveries</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-xs">
                Monitor incoming shipments and manage delivery schedules
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader className="p-4 pb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-sm">Manage Inventory</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-xs">
                Keep track of stock levels and product availability
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader className="p-4 pb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-sm">Analyze Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-xs">
                Evaluate supplier reliability and product quality metrics
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted/30 rounded-lg max-w-md">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Quick Tips</span>
          </div>
          <ul className="text-sm text-muted-foreground text-left space-y-1">
            <li>• Add contact information for better communication</li>
            <li>• Set up delivery preferences and payment terms</li>
            <li>• Categorize suppliers for better organization</li>
          </ul>
        </div>
      </div>
    </>
  );
}
