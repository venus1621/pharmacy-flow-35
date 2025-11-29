import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockTransfersApi, medicinesApi, assignmentsApi } from "@/services/backendApi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Clock, Check, X } from "lucide-react";

export const StockRequestForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  // Get pharmacist's branch
  const { data: assignment } = useQuery({
    queryKey: ["pharmacist-assignment", user?.id],
    queryFn: async () => {
      const assignments = await assignmentsApi.getAll();
      return assignments.find((a: any) => a.pharmacist_id === user?.id);
    },
    enabled: !!user?.id,
  });

  // Fetch available medicines
  const { data: medicines } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => medicinesApi.getAll(),
  });

  // Fetch pharmacist's transfer requests
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["my-transfers", user?.id],
    queryFn: async () => {
      const allTransfers = await stockTransfersApi.getAll();
      return allTransfers.filter((t: any) => t.requested_by === user?.id);
    },
    enabled: !!user?.id,
  });

  // Create transfer request
  const createRequest = useMutation({
    mutationFn: async () => {
      if (!assignment?.branch_id || !selectedMedicine || !quantity) {
        throw new Error("Please fill all fields");
      }

      await stockTransfersApi.create({
        branch_id: assignment.branch_id,
        medicine_id: selectedMedicine,
        quantity: parseInt(quantity),
        notes: notes || null,
        requested_by: user?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock transfer request submitted",
      });
      setSelectedMedicine("");
      setQuantity("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["my-transfers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRequest.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1"><Check className="h-3 w-3" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = transfers?.filter((t: any) => t.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Request Stock Transfer</h2>
        <p className="text-muted-foreground">
          Branch: {assignment?.branch_id || "Not assigned"}
        </p>
      </div>

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Package className="inline h-5 w-5 mr-2" />
            New Transfer Request
          </CardTitle>
          <CardDescription>Request medicines from the main warehouse</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="medicine">Medicine</Label>
                <Select value={selectedMedicine} onValueChange={setSelectedMedicine} required>
                  <SelectTrigger id="medicine">
                    <SelectValue placeholder="Select medicine" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicines?.map((med: any) => (
                      <SelectItem key={med.id} value={med.id}>
                        {med.name}
                        {med.brand_name && ` (${med.brand_name})`}
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
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional information..."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={createRequest.isPending}>
              {createRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>My Transfer Requests</CardTitle>
          <CardDescription>
            {pendingCount > 0 && (
              <span className="text-warning">{pendingCount} pending request{pendingCount > 1 ? "s" : ""}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading...</p>
          ) : transfers?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No transfer requests yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers?.map((transfer: any) => {
                  const medicine = medicines?.find((m: any) => m.id === transfer.medicine_id);
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        <div>{medicine?.name || 'Unknown'}</div>
                        {medicine?.brand_name && (
                          <div className="text-sm text-primary">{medicine.brand_name}</div>
                        )}
                      </TableCell>
                      <TableCell>{transfer.quantity} {medicine?.unit || 'unit'}</TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">{transfer.notes || "-"}</TableCell>
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