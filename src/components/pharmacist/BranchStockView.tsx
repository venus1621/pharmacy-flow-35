import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Package } from "lucide-react";
import { useState } from "react";

export const BranchStockView = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Get pharmacist's branch
  const { data: assignment } = useQuery({
    queryKey: ["pharmacist-assignment", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacist_assignments")
        .select("branch_id, branches(name)")
        .eq("pharmacist_id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch branch stock
  const { data: branchStock, isLoading } = useQuery({
    queryKey: ["branch-stock", assignment?.branch_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_stock")
        .select(`
          *,
          medicines (name, brand_name, unit, category, requires_prescription)
        `)
        .eq("branch_id", assignment?.branch_id)
        .order("medicines(name)");
      
      if (error) throw error;
      return data;
    },
    enabled: !!assignment?.branch_id,
  });

  const getDaysUntilExpiry = (expireDate: string) => {
    const today = new Date();
    const expire = new Date(expireDate);
    const diffTime = expire.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity < 10) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Low Stock</Badge>;
    } else {
      return <Badge className="bg-success/10 text-success border-success/20">In Stock</Badge>;
    }
  };

  const getExpiryWarning = (expireDate: string) => {
    const days = getDaysUntilExpiry(expireDate);
    if (days < 0) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Expired</Badge>;
    } else if (days < 30) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{days}d</Badge>;
    } else if (days < 90) {
      return <Badge className="bg-warning/10 text-warning border-warning/20 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{days}d</Badge>;
    }
    return null;
  };

  const filteredStock = branchStock?.filter((stock: any) =>
    stock.medicines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.medicines.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.medicines.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = branchStock?.filter((s: any) => s.quantity < 10 && s.quantity > 0).length || 0;
  const outOfStockCount = branchStock?.filter((s: any) => s.quantity === 0).length || 0;
  const expiringCount = branchStock?.filter((s: any) => getDaysUntilExpiry(s.expire_date) < 90 && getDaysUntilExpiry(s.expire_date) >= 0).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Branch Stock</h2>
        <p className="text-muted-foreground">
          Branch: {assignment?.branches?.name || "Not assigned"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchStock?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Unique medicines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items below 10 units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">Within 3 months</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Current stock levels and expiry dates</CardDescription>
            </div>
            <div className="w-64">
              <Input
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading...</p>
          ) : filteredStock?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No stock available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Expire Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock?.map((stock: any) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">
                      <div>{stock.medicines.name}</div>
                      {stock.medicines.brand_name && (
                        <div className="text-sm text-primary">{stock.medicines.brand_name}</div>
                      )}
                      {stock.medicines.requires_prescription && (
                        <Badge variant="outline" className="ml-2 text-xs">Rx</Badge>
                      )}
                    </TableCell>
                    <TableCell>{stock.medicines.category}</TableCell>
                    <TableCell>{stock.batch_number || "-"}</TableCell>
                    <TableCell>
                      {stock.quantity} {stock.medicines.unit}
                    </TableCell>
                    <TableCell>${Number(stock.selling_price).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {new Date(stock.expire_date).toLocaleDateString()}
                        {getExpiryWarning(stock.expire_date)}
                      </div>
                    </TableCell>
                    <TableCell>{getStockStatus(stock.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
