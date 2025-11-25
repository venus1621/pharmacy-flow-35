import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const StockTransferManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all stock transfers
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["stock-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_transfers")
        .select(`
          *,
          branches (name),
          medicines (name, brand_name, unit),
          profiles!stock_transfers_requested_by_fkey (full_name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Approve transfer mutation
  const approveTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      const transfer = transfers?.find((t) => t.id === transferId);
      if (!transfer) throw new Error("Transfer not found");

      // Check if there's enough stock in main_stock
      const { data: mainStock, error: stockError } = await supabase
        .from("main_stock")
        .select("*")
        .eq("medicine_id", transfer.medicine_id)
        .order("expire_date", { ascending: true })
        .limit(1)
        .single();

      if (stockError || !mainStock) {
        throw new Error("Insufficient stock in main warehouse");
      }

      if (mainStock.quantity < transfer.quantity) {
        throw new Error(`Only ${mainStock.quantity} units available in main stock`);
      }

      // Start transaction-like operations
      // 1. Update transfer status
      const { error: updateError } = await supabase
        .from("stock_transfers")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", transferId);

      if (updateError) throw updateError;

      // 2. Reduce main stock
      const { error: reduceError } = await supabase
        .from("main_stock")
        .update({
          quantity: mainStock.quantity - transfer.quantity,
        })
        .eq("id", mainStock.id);

      if (reduceError) throw reduceError;

      // 3. Add to branch stock or update existing
      const { data: existingBranchStock } = await supabase
        .from("branch_stock")
        .select("*")
        .eq("branch_id", transfer.branch_id)
        .eq("medicine_id", transfer.medicine_id)
        .eq("batch_number", mainStock.batch_number || "")
        .single();

      if (existingBranchStock) {
        // Update existing stock
        const { error: branchUpdateError } = await supabase
          .from("branch_stock")
          .update({
            quantity: existingBranchStock.quantity + transfer.quantity,
          })
          .eq("id", existingBranchStock.id);

        if (branchUpdateError) throw branchUpdateError;
      } else {
        // Create new branch stock entry
        const { error: branchInsertError } = await supabase
          .from("branch_stock")
          .insert({
            branch_id: transfer.branch_id,
            medicine_id: transfer.medicine_id,
            quantity: transfer.quantity,
            batch_number: mainStock.batch_number,
            expire_date: mainStock.expire_date,
            selling_price: mainStock.purchase_price * 1.3, // 30% markup
          });

        if (branchInsertError) throw branchInsertError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer approved and stock moved to branch",
      });
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["main-stock"] });
      queryClient.invalidateQueries({ queryKey: ["branch-stock"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject transfer mutation
  const rejectTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from("stock_transfers")
        .update({
          status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", transferId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer request rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1"><Check className="h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingTransfers = transfers?.filter((t) => t.status === "pending") || [];
  const processedTransfers = transfers?.filter((t) => t.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Stock Transfer Management</h2>
        <p className="text-muted-foreground">Review and approve stock transfer requests from branches</p>
      </div>

      {/* Pending Transfers */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests ({pendingTransfers.length})</CardTitle>
          <CardDescription>Review and approve or reject transfer requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading...</p>
          ) : pendingTransfers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending transfer requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransfers.map((transfer: any) => (
                  <TableRow key={transfer.id}>
                    <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{transfer.branches?.name || "Unknown Branch"}</TableCell>
                    <TableCell>
                      <div>{transfer.medicines?.name || "Unknown Medicine"}</div>
                      {transfer.medicines?.brand_name && (
                        <div className="text-sm text-primary">{transfer.medicines.brand_name}</div>
                      )}
                    </TableCell>
                    <TableCell>{transfer.quantity} {transfer.medicines?.unit || "units"}</TableCell>
                    <TableCell>{transfer.profiles?.full_name || "Unknown User"}</TableCell>
                    <TableCell className="max-w-xs truncate">{transfer.notes || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveTransfer.mutate(transfer.id)}
                          disabled={approveTransfer.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectTransfer.mutate(transfer.id)}
                          disabled={rejectTransfer.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>View all processed transfer requests</CardDescription>
        </CardHeader>
        <CardContent>
          {processedTransfers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No transfer history</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedTransfers.map((transfer: any) => (
                  <TableRow key={transfer.id}>
                    <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{transfer.branches?.name || "Unknown Branch"}</TableCell>
                    <TableCell>
                      <div>{transfer.medicines?.name || "Unknown Medicine"}</div>
                      {transfer.medicines?.brand_name && (
                        <div className="text-sm text-primary">{transfer.medicines.brand_name}</div>
                      )}
                    </TableCell>
                    <TableCell>{transfer.quantity} {transfer.medicines?.unit || "units"}</TableCell>
                    <TableCell>{transfer.profiles?.full_name || "Unknown User"}</TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell>
                      {transfer.approved_at ? new Date(transfer.approved_at).toLocaleDateString() : "-"}
                    </TableCell>
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
