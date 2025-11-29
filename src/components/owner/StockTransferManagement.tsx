import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { stockTransfersApi, branchesApi, medicinesApi } from "@/services/backendApi";

interface Transfer {
  id: string;
  branch_id: string | { id: string; name?: string };
  medicine_id: string | Medicine;
  medicine?: Medicine;
  quantity: number;
  requested_by?: string | Profile;
  approved_by?: string | Profile;
  approved_at?: string;
  created_at: string;
  status: string;
  notes?: string;
}

interface Medicine {
  id: string;
  name: string;
  brand_name?: string;
  unit?: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name?: string;
}

export const StockTransferManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all stock transfers
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["stock-transfers"],
    queryFn: async () => {
      const data = await stockTransfersApi.getAll();
      return data || [];
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const data = await branchesApi.getAll();
      return data || [];
    },
  });

  const { data: medicines } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const data = await medicinesApi.getAll();
      return data || [];
    },
  });

  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    (branches || []).forEach((branch: Branch) => {
      map.set(branch.id, branch);
    });
    return map;
  }, [branches]);

  const medicineMap = useMemo(() => {
    const map = new Map<string, Medicine>();
    (medicines || []).forEach((medicine: Medicine) => {
      map.set(medicine.id, medicine);
    });
    return map;
  }, [medicines]);

  const resolveBranch = (transfer: Transfer) => {
    if (!transfer.branch_id) return undefined;
    if (typeof transfer.branch_id === "object") {
      return transfer.branch_id;
    }
    return branchMap.get(transfer.branch_id);
  };

  const resolveMedicine = (transfer: Transfer) => {
    if (transfer.medicine && typeof transfer.medicine === "object") {
      return transfer.medicine;
    }
    if (transfer.medicine_id && typeof transfer.medicine_id === "object") {
      return transfer.medicine_id;
    }
    if (typeof transfer.medicine_id === "string") {
      return medicineMap.get(transfer.medicine_id);
    }
    return undefined;
  };

  const resolveProfileName = (profile?: string | Profile) => {
    if (!profile) return "Unknown User";
    if (typeof profile === "object") return profile.full_name || "Unknown User";
    return profile;
  };

  // Approve transfer mutation
  const approveTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      await stockTransfersApi.update(transferId, {
        status: "approved",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer approved and stock update requested",
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

  // Reject transfer mutation
  const rejectTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      await stockTransfersApi.update(transferId, {
        status: "rejected",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      });
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

  const pendingTransfers = transfers?.filter((t: Transfer) => t.status === "pending") || [];
  const processedTransfers = transfers?.filter((t: Transfer) => t.status !== "pending") || [];

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
                {pendingTransfers.map((transfer: Transfer) => {
                  const branch = resolveBranch(transfer);
                  const medicine = resolveMedicine(transfer);
                  return (
                  <TableRow key={transfer.id}>
                    <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{branch?.name || "Unknown Branch"}</TableCell>
                    <TableCell>
                      <div>{medicine?.name || "Unknown Medicine"}</div>
                      {medicine?.brand_name && (
                        <div className="text-sm text-primary">{medicine.brand_name}</div>
                      )}
                    </TableCell>
                    <TableCell>{transfer.quantity} {medicine?.unit || "units"}</TableCell>
                    <TableCell>{resolveProfileName(transfer.requested_by)}</TableCell>
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
                )})}
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
                {processedTransfers.map((transfer: Transfer) => {
                  const branch = resolveBranch(transfer);
                  const medicine = resolveMedicine(transfer);
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{branch?.name || "Unknown Branch"}</TableCell>
                      <TableCell>
                        <div>{medicine?.name || "Unknown Medicine"}</div>
                        {medicine?.brand_name && (
                          <div className="text-sm text-primary">{medicine.brand_name}</div>
                        )}
                      </TableCell>
                      <TableCell>{transfer.quantity} {medicine?.unit || "units"}</TableCell>
                      <TableCell>{resolveProfileName(transfer.requested_by)}</TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell>
                        {transfer.approved_at ? new Date(transfer.approved_at).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
