import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mainStockApi, medicinesApi, branchStockApi, branchesApi } from "@/services/backendApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowRight, Package, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

export const AdvancedInventoryControl = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [transferBranch, setTransferBranch] = useState("");
  const [transferMedicine, setTransferMedicine] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");

  // Fetch all inventory data
  const { data: inventoryData } = useQuery({
    queryKey: ["complete-inventory"],
    queryFn: async () => {
      const [mainStock, branchStock, branches, medicines] = await Promise.all([
        mainStockApi.getAll(),
        branchStockApi.getByBranch("all"),
        branchesApi.getAll(),
        medicinesApi.getAll(),
      ]);

      // Create medicine lookup map
      const medicineMap = new Map(medicines.map((m: any) => [m.id, m]));

      // Calculate inventory metrics
      const mainTotal = mainStock.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const branchTotal = branchStock.reduce((sum: number, item: any) => sum + item.quantity, 0);

      // Group by medicine for distribution view
      const medicineDistribution: Record<string, any> = {};
      
      mainStock.forEach((stock: any) => {
        const medicine: any = medicineMap.get(stock.medicine_id);
        if (!medicineDistribution[stock.medicine_id]) {
          medicineDistribution[stock.medicine_id] = {
            name: medicine?.name || 'Unknown',
            brand_name: medicine?.brand_name,
            unit: medicine?.unit || 'unit',
            mainStock: 0,
            branchStocks: {},
            totalBranch: 0,
          };
        }
        medicineDistribution[stock.medicine_id].mainStock += stock.quantity;
      });

      branchStock.forEach((stock: any) => {
        const medicine: any = medicineMap.get(stock.medicine_id);
        if (!medicineDistribution[stock.medicine_id]) {
          medicineDistribution[stock.medicine_id] = {
            name: medicine?.name || 'Unknown',
            brand_name: medicine?.brand_name,
            unit: medicine?.unit || 'unit',
            mainStock: 0,
            branchStocks: {},
            totalBranch: 0,
          };
        }
        
        const branch = branches.find((b: any) => b.id === stock.branch_id);
        const branchName = branch?.name || 'Unknown';
        if (!medicineDistribution[stock.medicine_id].branchStocks[branchName]) {
          medicineDistribution[stock.medicine_id].branchStocks[branchName] = 0;
        }
        medicineDistribution[stock.medicine_id].branchStocks[branchName] += stock.quantity;
        medicineDistribution[stock.medicine_id].totalBranch += stock.quantity;
      });

      return {
        mainStock,
        branchStock,
        branches: branches.filter((b: any) => b.is_active),
        mainTotal,
        branchTotal,
        totalItems: mainTotal + branchTotal,
        medicineDistribution: Object.values(medicineDistribution),
      };
    },
  });

  // Direct stock transfer mutation
  const directTransfer = useMutation({
    mutationFn: async () => {
      if (!transferBranch || !transferMedicine || !transferQuantity) {
        throw new Error("Please fill all fields");
      }

      const qty = parseInt(transferQuantity);

      // This operation requires backend support - for now, show error
      throw new Error("Direct stock transfer feature requires backend implementation. Please use Stock Transfer Management for transfer requests.");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock transferred successfully",
      });
      setTransferBranch("");
      setTransferMedicine("");
      setTransferQuantity("");
      queryClient.invalidateQueries({ queryKey: ["complete-inventory"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch medicines for dropdown
  const { data: medicines } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => medicinesApi.getAll(),
  });

  const getDistributionPercentage = (branchTotal: number, mainTotal: number) => {
    const total = branchTotal + mainTotal;
    return total > 0 ? ((branchTotal / total) * 100).toFixed(1) : "0.0";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Advanced Inventory Control</h2>
        <p className="text-muted-foreground">Manage stock distribution and movements</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryData?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">Units across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main Warehouse</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryData?.mainTotal || 0}</div>
            <p className="text-xs text-muted-foreground">
              {inventoryData?.totalItems ? 
                ((inventoryData.mainTotal / inventoryData.totalItems) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Branches</CardTitle>
            <TrendingDown className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryData?.branchTotal || 0}</div>
            <p className="text-xs text-muted-foreground">
              {inventoryData?.totalItems ?
                ((inventoryData.branchTotal / inventoryData.totalItems) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryData?.branches?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Locations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="distribution">
        <TabsList>
          <TabsTrigger value="distribution">Distribution View</TabsTrigger>
          <TabsTrigger value="transfer">Direct Transfer</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medicine Distribution Across Locations</CardTitle>
              <CardDescription>View how each medicine is distributed between main warehouse and branches</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Main Stock</TableHead>
                    <TableHead>Branch Stock</TableHead>
                    <TableHead>Branch Distribution</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData?.medicineDistribution?.map((item: any) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.mainStock} {item.unit}</TableCell>
                      <TableCell>{item.totalBranch} {item.unit}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getDistributionPercentage(item.totalBranch, item.mainStock)}% in branches
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {item.mainStock + item.totalBranch} {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Direct Stock Transfer</CardTitle>
              <CardDescription>Transfer stock from main warehouse to branches instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); directTransfer.mutate(); }} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="medicine">Medicine</Label>
                    <Select value={transferMedicine} onValueChange={setTransferMedicine}>
                      <SelectTrigger id="medicine">
                        <SelectValue placeholder="Select medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines?.map((med) => (
                          <SelectItem key={med.id} value={med.id}>
                            {med.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="branch">To Branch</Label>
                    <Select value={transferBranch} onValueChange={setTransferBranch}>
                      <SelectTrigger id="branch">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryData?.branches?.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(e.target.value)}
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={directTransfer.isPending}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {directTransfer.isPending ? "Transferring..." : "Transfer Stock"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>Track inventory movements and transfers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Stock movement history coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
