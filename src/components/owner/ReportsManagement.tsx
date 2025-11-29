import { useQuery } from "@tanstack/react-query";
import { transactionsApi, mainStockApi, branchStockApi } from "@/services/backendApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Package, AlertTriangle, TrendingUp } from "lucide-react";

export const ReportsManagement = () => {
  // Fetch sales summary
  const { data: salesSummary } = useQuery({
    queryKey: ["sales-summary"],
    queryFn: async () => {
      const data = await transactionsApi.getAll();

      // Calculate totals by branch
      const branchTotals: Record<string, { name: string; total: number; count: number }> = {};
      let grandTotal = 0;

      data.forEach((transaction: any) => {
        const branchId = transaction.branch_id;
        const branchName = transaction.branches?.name || "";
        const amount = Number(transaction.total_amount);

        if (!branchTotals[branchId]) {
          branchTotals[branchId] = { name: branchName, total: 0, count: 0 };
        }

        branchTotals[branchId].total += amount;
        branchTotals[branchId].count += 1;
        grandTotal += amount;
      });

      return {
        transactions: data,
        branchTotals: Object.values(branchTotals),
        grandTotal,
        totalTransactions: data.length,
      };
    },
  });

  // Fetch stock levels
  const { data: stockLevels } = useQuery({
    queryKey: ["stock-levels"],
    queryFn: async () => {
      const mainStock = await mainStockApi.getAll();
      const branchStock = await branchStockApi.getAll();

      // Calculate totals by medicine
      const medicineStocks: Record<string, { name: string; unit: string; mainStock: number; branchStock: number }> = {};

      mainStock.forEach((stock: any) => {
        const medicineId = stock.medicine_id;
        if (!medicineStocks[medicineId]) {
          medicineStocks[medicineId] = {
            name: stock.medicines.name,
            unit: stock.medicines.unit,
            mainStock: 0,
            branchStock: 0,
          };
        }
        medicineStocks[medicineId].mainStock += stock.quantity;
      });

      branchStock.forEach((stock: any) => {
        const medicineId = stock.medicine_id;
        if (!medicineStocks[medicineId]) {
          medicineStocks[medicineId] = {
            name: stock.medicines.name,
            unit: stock.medicines.unit,
            mainStock: 0,
            branchStock: 0,
          };
        }
        medicineStocks[medicineId].branchStock += stock.quantity;
      });

      return {
        medicineStocks: Object.values(medicineStocks),
        branchStockDetails: branchStock,
      };
    },
  });

  // Fetch expiring medicines
  const { data: expiringMedicines } = useQuery({
    queryKey: ["expiring-medicines"],
    queryFn: async () => {
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      const mainStock = (await mainStockApi.getAll()).filter((s: any) => new Date(s.expire_date) <= threeMonthsFromNow);
      const branchStock = (await branchStockApi.getAll()).filter((s: any) => new Date(s.expire_date) <= threeMonthsFromNow);

      return {
        mainStockExpiring: mainStock,
        branchStockExpiring: branchStock,
      };
    },
  });

  const getDaysUntilExpiry = (expireDate: string) => {
    const today = new Date();
    const expire = new Date(expireDate);
    const diffTime = expire.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadge = (expireDate: string) => {
    const days = getDaysUntilExpiry(expireDate);
    if (days < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (days < 30) {
      return <Badge variant="destructive">{days} days</Badge>;
    } else if (days < 90) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">{days} days</Badge>;
    }
    return <Badge variant="outline">{days} days</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-muted-foreground">View sales, inventory, and business insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${salesSummary?.grandTotal.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesSummary?.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Medicines</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stockLevels?.medicineStocks.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(expiringMedicines?.mainStockExpiring.length || 0) + (expiringMedicines?.branchStockExpiring.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Within 3 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${salesSummary?.totalTransactions
                ? (salesSummary.grandTotal / salesSummary.totalTransactions).toFixed(2)
                : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Per sale</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales by Branch</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Levels</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Branch</CardTitle>
              <CardDescription>Revenue breakdown by branch location</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Avg. Sale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesSummary?.branchTotals.map((branch: any) => (
                    <TableRow key={branch.name}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.count}</TableCell>
                      <TableCell>${branch.total.toFixed(2)}</TableCell>
                      <TableCell>${(branch.total / branch.count).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Levels</CardTitle>
              <CardDescription>Stock distribution across main warehouse and branches</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Main Stock</TableHead>
                    <TableHead>Branch Stock</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockLevels?.medicineStocks.map((medicine: any) => (
                    <TableRow key={medicine.name}>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.mainStock} {medicine.unit}</TableCell>
                      <TableCell>{medicine.branchStock} {medicine.unit}</TableCell>
                      <TableCell className="font-semibold">
                        {medicine.mainStock + medicine.branchStock} {medicine.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Stock - Main Warehouse</CardTitle>
              <CardDescription>Medicines expiring within 3 months in main stock</CardDescription>
            </CardHeader>
            <CardContent>
              {expiringMedicines?.mainStockExpiring.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No expiring stock in main warehouse</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Expire Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringMedicines?.mainStockExpiring.map((stock: any) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.medicines.name}</TableCell>
                        <TableCell>{stock.batch_number || "-"}</TableCell>
                        <TableCell>{stock.quantity} {stock.medicines.unit}</TableCell>
                        <TableCell>{new Date(stock.expire_date).toLocaleDateString()}</TableCell>
                        <TableCell>{getExpiryBadge(stock.expire_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expiring Stock - Branches</CardTitle>
              <CardDescription>Medicines expiring within 3 months in branch locations</CardDescription>
            </CardHeader>
            <CardContent>
              {expiringMedicines?.branchStockExpiring.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No expiring stock in branches</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Expire Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringMedicines?.branchStockExpiring.map((stock: any) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.branches.name}</TableCell>
                        <TableCell>{stock.medicines.name}</TableCell>
                        <TableCell>{stock.batch_number || "-"}</TableCell>
                        <TableCell>{stock.quantity} {stock.medicines.unit}</TableCell>
                        <TableCell>{new Date(stock.expire_date).toLocaleDateString()}</TableCell>
                        <TableCell>{getExpiryBadge(stock.expire_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
