import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function BranchStockView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch branches
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch branch stock with medicine and branch details
  const { data: branchStock, isLoading } = useQuery({
    queryKey: ["branch-stock", selectedBranch],
    queryFn: async () => {
      let query = supabase
        .from("branch_stock")
        .select(`
          *,
          medicines(id, name, brand_name, category, unit),
          branches(id, name, location)
        `)
        .order("created_at", { ascending: false });

      if (selectedBranch !== "all") {
        query = query.eq("branch_id", selectedBranch);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("branch_stock")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-stock"] });
      toast.success("Stock item removed successfully");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to remove stock item: " + error.message);
    },
  });

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  // Filter stock based on search query
  const filteredStock = branchStock?.filter((item: any) => {
    const medicineName = item.medicines?.name?.toLowerCase() || "";
    const brandName = item.medicines?.brand_name?.toLowerCase() || "";
    const branchName = item.branches?.name?.toLowerCase() || "";
    const search = searchQuery.toLowerCase();
    return medicineName.includes(search) || brandName.includes(search) || branchName.includes(search);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Branch Stock Management
          </CardTitle>
          <CardDescription>
            View and manage stock across all branches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by medicine or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stock Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock && filteredStock.length > 0 ? (
                    filteredStock.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.branches?.name}
                        </TableCell>
                        <TableCell>{item.medicines?.name}</TableCell>
                        <TableCell>{item.medicines?.brand_name || "-"}</TableCell>
                        <TableCell>{item.batch_number || "-"}</TableCell>
                        <TableCell>
                          <span className={item.quantity < 10 ? "text-destructive font-semibold" : ""}>
                            {item.quantity} {item.medicines?.unit}
                          </span>
                        </TableCell>
                        <TableCell>${item.selling_price}</TableCell>
                        <TableCell>
                          {format(new Date(item.expire_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No stock items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Stock Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this stock item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
