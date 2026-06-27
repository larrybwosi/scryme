// components/supplier-deliveries/deliveries-skeleton.tsx
import { Card, CardContent, CardHeader } from "@repo/ui/components/ui/card";

export const DeliveriesSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-12 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-28 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
