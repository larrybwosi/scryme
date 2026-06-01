'use client';

import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ui/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

interface KPIMetric {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}

interface ProductionMetrics {
  totalBatches: number;
  completedBatches: number;
  inProgressBatches: number;
  cancelledBatches: number;
  totalUnitsProduced: number;
  averageCompletionTime: number;
  onTimeDelivery: number;
  materialWaste: number;
  totalRevenue: number;
  totalCost: number;
  profitMargin: number;
}

interface TrendData {
  date: string;
  batches: number;
  revenue: number;
  cost: number;
  units: number;
}

interface ProductPerformance {
  productName: string;
  batchesProduced: number;
  unitsProduced: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

interface AnalyticsDashboardProps {
  metrics: ProductionMetrics;
  trendData: TrendData[];
  productPerformance: ProductPerformance[];
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange: (range: 'week' | 'month' | 'quarter' | 'year') => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#fb923c'];

export function ProductionAnalyticsDashboard({
  metrics,
  trendData,
  productPerformance,
  timeRange,
  onTimeRangeChange,
}: AnalyticsDashboardProps) {
  const kpis: KPIMetric[] = [
    {
      label: 'Total Batches',
      value: metrics.totalBatches,
      change: 12.5,
      changeLabel: 'vs last period',
      icon: Package,
      trend: 'up',
    },
    {
      label: 'Completion Rate',
      value: `${((metrics.completedBatches / metrics.totalBatches) * 100).toFixed(1)}%`,
      change: 5.2,
      changeLabel: 'vs last period',
      icon: CheckCircle,
      trend: 'up',
    },
    {
      label: 'Total Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      change: 18.3,
      changeLabel: 'vs last period',
      icon: DollarSign,
      trend: 'up',
    },
    {
      label: 'Profit Margin',
      value: `${metrics.profitMargin.toFixed(1)}%`,
      change: -2.1,
      changeLabel: 'vs last period',
      icon: TrendingUp,
      trend: 'down',
    },
    {
      label: 'Avg. Production Time',
      value: `${metrics.averageCompletionTime} min`,
      change: -8.4,
      changeLabel: 'vs last period',
      icon: Clock,
      trend: 'up',
    },
    {
      label: 'On-Time Delivery',
      value: `${metrics.onTimeDelivery.toFixed(1)}%`,
      change: 3.7,
      changeLabel: 'vs last period',
      icon: Activity,
      trend: 'up',
    },
    {
      label: 'Material Waste',
      value: `${metrics.materialWaste.toFixed(1)}%`,
      change: -1.2,
      changeLabel: 'vs last period',
      icon: AlertTriangle,
      trend: 'up',
    },
    {
      label: 'Units Produced',
      value: metrics.totalUnitsProduced.toLocaleString(),
      change: 15.8,
      changeLabel: 'vs last period',
      icon: Package,
      trend: 'up',
    },
  ];

  // Batch status distribution
  const statusData = [
    { name: 'Completed', value: metrics.completedBatches, color: COLORS[0] },
    { name: 'In Progress', value: metrics.inProgressBatches, color: COLORS[1] },
    { name: 'Cancelled', value: metrics.cancelledBatches, color: COLORS[3] },
  ];

  // Top performing products
  const topProducts = [...productPerformance]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Production Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your production performance
          </p>
        </div>

        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend === 'up';
          const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

          return (
            <Card key={kpi.label} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-2xl font-bold">{kpi.value}</p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendIcon
                    className={cn(
                      'h-3 w-3',
                      isPositiveTrend ? 'text-green-600' : 'text-red-600'
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium',
                      isPositiveTrend ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {Math.abs(kpi.change)}%
                  </span>
                  <span className="text-muted-foreground">{kpi.changeLabel}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Production Trends
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Product Performance
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <PieChart className="h-4 w-4" />
            Batch Distribution
          </TabsTrigger>
        </TabsList>

        {/* Production Trends */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Batches Over Time */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Batches Produced</h3>
              <ChartContainer
                config={{
                  batches: {
                    label: 'Batches',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="batches" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>

            {/* Revenue vs Cost */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Revenue vs Cost</h3>
              <ChartContainer
                config={{
                  revenue: {
                    label: 'Revenue',
                    color: 'hsl(var(--chart-2))',
                  },
                  cost: {
                    label: 'Cost',
                    color: 'hsl(var(--chart-4))',
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>
          </div>

          {/* Units Produced */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Units Produced</h3>
            <ChartContainer
              config={{
                units: {
                  label: 'Units',
                  color: 'hsl(var(--chart-3))',
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="units" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </TabsContent>

        {/* Product Performance */}
        <TabsContent value="products" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Top Performing Products</h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.productName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.batchesProduced} batches • {product.unitsProduced} units
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${product.profit.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.margin.toFixed(1)}% margin</p>
                    </div>
                  </div>
                  {index < topProducts.length - 1 && (
                    <div className="h-px bg-border" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Product Comparison Table */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Product Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Batches
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Units
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Revenue
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Cost
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Profit
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Margin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.map((product) => (
                    <tr key={product.productName} className="border-b last:border-b-0">
                      <td className="py-3 px-2 font-medium">{product.productName}</td>
                      <td className="py-3 px-2 text-right">{product.batchesProduced}</td>
                      <td className="py-3 px-2 text-right">{product.unitsProduced}</td>
                      <td className="py-3 px-2 text-right">${product.revenue.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">${product.cost.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-green-600 font-semibold">
                        ${product.profit.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Badge
                          variant={product.margin >= 30 ? 'default' : 'outline'}
                          className={cn(
                            product.margin >= 30 && 'bg-green-500/10 text-green-600 border-green-500/20'
                          )}
                        >
                          {product.margin.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Batch Distribution */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pie Chart */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Batch Status Distribution</h3>
              <ChartContainer
                config={{
                  completed: {
                    label: 'Completed',
                    color: COLORS[0],
                  },
                  inProgress: {
                    label: 'In Progress',
                    color: COLORS[1],
                  },
                  cancelled: {
                    label: 'Cancelled',
                    color: COLORS[3],
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent || 0 * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RePieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>

            {/* Status Breakdown */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Status Breakdown</h3>
              <div className="space-y-4">
                {statusData.map((status) => (
                  <div key={status.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="font-medium">{status.name}</span>
                      </div>
                      <span className="font-semibold">{status.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: status.color,
                          width: `${(status.value / metrics.totalBatches) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {((status.value / metrics.totalBatches) * 100).toFixed(1)}% of total batches
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
