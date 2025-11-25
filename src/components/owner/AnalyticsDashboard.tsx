import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi, branchesApi, mainStockApi } from "@/services/backendApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CalendarIcon, TrendingUp, DollarSign, Package, ShoppingCart } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [timeView, setTimeView] = useState<"daily" | "weekly" | "monthly">("daily");

  // Fetch transactions for analytics
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["analytics-transactions", dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          transaction_items(*),
          branches(name),
          profiles(full_name)
        `)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate statistics
  const stats = {
    totalRevenue: transactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0,
    totalTransactions: transactions?.length || 0,
    averageTransaction: transactions?.length 
      ? (transactions.reduce((sum, t) => sum + Number(t.total_amount), 0) / transactions.length)
      : 0,
  };

  // Prepare daily data
  const getDailyData = () => {
    if (!transactions) return [];
    
    const dailyMap = new Map();
    transactions.forEach((t) => {
      const date = format(new Date(t.created_at), "MMM dd");
      const existing = dailyMap.get(date) || { date, revenue: 0, transactions: 0 };
      dailyMap.set(date, {
        date,
        revenue: existing.revenue + Number(t.total_amount),
        transactions: existing.transactions + 1,
      });
    });
    
    return Array.from(dailyMap.values());
  };

  // Prepare branch performance data
  const getBranchData = () => {
    if (!transactions) return [];
    
    const branchMap = new Map();
    transactions.forEach((t) => {
      const branchName = t.branches?.name || "Unknown";
      const existing = branchMap.get(branchName) || { name: branchName, value: 0 };
      branchMap.set(branchName, {
        name: branchName,
        value: existing.value + Number(t.total_amount),
      });
    });
    
    return Array.from(branchMap.values());
  };

  // Prepare payment method data
  const getPaymentMethodData = () => {
    if (!transactions) return [];
    
    const methodMap = new Map();
    transactions.forEach((t) => {
      const method = t.payment_method;
      const existing = methodMap.get(method) || { name: method, value: 0 };
      methodMap.set(method, {
        name: method,
        value: existing.value + 1,
      });
    });
    
    return Array.from(methodMap.values());
  };

  const handlePresetRange = (preset: "today" | "week" | "month") => {
    const now = new Date();
    switch (preset) {
      case "today":
        setDateRange({ from: startOfDay(now), to: endOfDay(now) });
        setTimeView("daily");
        break;
      case "week":
        setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
        setTimeView("daily");
        break;
      case "month":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        setTimeView("weekly");
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Sales and performance analytics
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePresetRange("today")}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePresetRange("week")}>
                This Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePresetRange("month")}>
                This Month
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {format(dateRange.from, "MMM dd")} to {format(dateRange.to, "MMM dd")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averageTransaction.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="branches">Branch Performance</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Daily revenue and transaction count</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getDailyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="transactions"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={2}
                      name="Transactions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branch Performance</CardTitle>
              <CardDescription>Revenue by branch</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getBranchData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Distribution of payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={getPaymentMethodData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPaymentMethodData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
