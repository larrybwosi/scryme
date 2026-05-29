"use client"

import { useState, useMemo } from "react"
import { usePosStore } from "@/store/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, DollarSign, ShoppingCart, Package, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AnalyticsPage() {
  const settings = usePosStore((state) => state.settings)
  const getDailySummary = usePosStore((state) => state.getDailySummary)
  const getTopProducts = usePosStore((state) => state.getTopProducts)
  const orders = usePosStore((state) => state.orders)
  const getLowStockProducts = usePosStore((state) => state.getLowStockProducts)

  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("today")
  const [selectedDate] = useState(new Date().toISOString().split("T")[0])

  const filteredOrders = useMemo(() => {
    const now = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0)
        break
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "all":
        startDate = new Date(0) // Beginning of time
        break
    }

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      return order.status === "completed" && orderDate >= startDate
    })
  }, [orders, dateRange])

  const dailySummary = useMemo(() => getDailySummary(selectedDate), [selectedDate, getDailySummary])
  const topProducts = useMemo(() => getTopProducts(5), [getTopProducts])
  const lowStockProducts = useMemo(() => getLowStockProducts(), [getLowStockProducts])

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0
  const totalDiscount = filteredOrders.reduce((sum, order) => sum + order.discount, 0)
  const totalTax = filteredOrders.reduce((sum, order) => sum + order.taxes, 0)

  const paymentMethodBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}
    filteredOrders.forEach((order) => {
      breakdown[order.paymentMethod] = (breakdown[order.paymentMethod] || 0) + order.total
    })
    return breakdown
  }, [filteredOrders])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your business performance</p>
        </div>

        <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground capitalize">
                  {dateRange === "all" ? "All time" : dateRange}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredOrders.length}</div>
                <p className="text-xs text-muted-foreground">Completed orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dailySummary.totalSales)}</div>
                <p className="text-xs text-muted-foreground">{dailySummary.totalOrders} orders</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Period Summary</CardTitle>
                <CardDescription className="capitalize">{dateRange === "all" ? "All Time" : dateRange}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totalRevenue - totalTax + totalDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-destructive">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(totalTax)}</span>
                </div>
                <div className="flex justify-between pt-4 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{formatCurrency(totalRevenue)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Breakdown by payment type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(paymentMethodBreakdown).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments in this period</p>
                ) : (
                  Object.entries(paymentMethodBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{method}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales data available</p>
                ) : (
                  topProducts.map((product, index) => (
                    <div key={product.productId} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-muted-foreground">{product.quantity} units sold</div>
                      </div>
                      <div className="font-semibold">{formatCurrency(product.revenue)}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {dailySummary.topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Top Products</CardTitle>
                <CardDescription>{new Date(selectedDate).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailySummary.topProducts.map((product, index) => (
                    <div key={product.productId} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-muted-foreground">{product.quantity} units sold</div>
                      </div>
                      <div className="font-semibold">{formatCurrency(product.revenue)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Products that need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All products are well stocked</p>
                ) : (
                  lowStockProducts.map((alert) => (
                    <div key={alert.productId} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Package
                          className={`w-5 h-5 ${alert.alertType === "out" ? "text-destructive" : "text-orange-500"}`}
                        />
                        <div>
                          <div className="font-medium">{alert.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.currentStock} {alert.currentStock === 1 ? "unit" : "units"} remaining
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Restock
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
