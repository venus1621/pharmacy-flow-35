import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const PharmacistManagement = () => {
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedPharmacist, setSelectedPharmacist] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    assignToBranch: "",
  });
  const [selectedBranch, setSelectedBranch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch owner's pharmacy
  const { data: pharmacy } = useQuery({
    queryKey: ["owner-pharmacy"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("pharmacies")
        .select("*")
        .eq("owner_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch pharmacists
  const { data: pharmacists, isLoading: loadingPharmacists } = useQuery({
    queryKey: ["pharmacists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "pharmacist")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch branches from owner's pharmacy
  const { data: branches } = useQuery({
    queryKey: ["branches", pharmacy?.id],
    queryFn: async () => {
      if (!pharmacy?.id) return [];
      
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("pharmacy_id", pharmacy.id)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!pharmacy?.id,
  });

  // Fetch assignments
  const { data: assignments } = useQuery({
    queryKey: ["pharmacist-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacist_assignments")
        .select(`
          *,
          branches (name),
          profiles (full_name)
        `);
      
      if (error) throw error;
      return data;
    },
  });

  // Create pharmacist mutation
  const createPharmacist = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: "pharmacist",
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      // If branch selected, assign pharmacist to branch
      if (data.assignToBranch && authData.user) {
        const { error: assignError } = await supabase
          .from("pharmacist_assignments")
          .insert({
            pharmacist_id: authData.user.id,
            branch_id: data.assignToBranch,
          });

        if (assignError) throw assignError;
      }

      return authData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pharmacist account created successfully",
      });
      setOpen(false);
      setFormData({ email: "", password: "", full_name: "", assignToBranch: "" });
      queryClient.invalidateQueries({ queryKey: ["pharmacists"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacist-assignments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign to branch mutation
  const assignToBranch = useMutation({
    mutationFn: async ({ pharmacistId, branchId }: { pharmacistId: string; branchId: string }) => {
      const { error } = await supabase
        .from("pharmacist_assignments")
        .insert({
          pharmacist_id: pharmacistId,
          branch_id: branchId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pharmacist assigned to branch successfully",
      });
      setAssignOpen(false);
      setSelectedPharmacist("");
      setSelectedBranch("");
      queryClient.invalidateQueries({ queryKey: ["pharmacist-assignments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove assignment mutation
  const removeAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("pharmacist_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assignment removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["pharmacist-assignments"] });
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
    createPharmacist.mutate(formData);
  };

  const handleAssign = () => {
    if (selectedPharmacist && selectedBranch) {
      assignToBranch.mutate({
        pharmacistId: selectedPharmacist,
        branchId: selectedBranch,
      });
    }
  };

  const getPharmacistAssignments = (pharmacistId: string) => {
    return assignments?.filter((a: any) => a.pharmacist_id === pharmacistId) || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pharmacist Management</h2>
          <p className="text-muted-foreground">Create and manage pharmacist accounts</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign to Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Pharmacist to Branch</DialogTitle>
                <DialogDescription>
                  Select a pharmacist and branch to create an assignment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Pharmacist</Label>
                  <Select value={selectedPharmacist} onValueChange={setSelectedPharmacist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pharmacist" />
                    </SelectTrigger>
                    <SelectContent>
                      {pharmacists?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Branch</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAssign} disabled={!selectedPharmacist || !selectedBranch}>
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Pharmacist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Pharmacist</DialogTitle>
                <DialogDescription>
                  Create a new pharmacist account with login credentials
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="pharmacist@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="assignToBranch">Assign to Branch (Optional)</Label>
                  <Select
                    value={formData.assignToBranch}
                    onValueChange={(value) => setFormData({ ...formData, assignToBranch: value })}
                  >
                    <SelectTrigger id="assignToBranch">
                      <SelectValue placeholder="Select a branch (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createPharmacist.isPending || !branches?.length}>
                    {createPharmacist.isPending ? "Creating..." : "Create Pharmacist"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Pharmacists</CardTitle>
          <CardDescription>View and manage pharmacist accounts and their branch assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPharmacists ? (
            <p className="text-center py-4">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Assigned Branches</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pharmacists?.map((pharmacist) => {
                  const pharmacistAssignments = getPharmacistAssignments(pharmacist.id);
                  return (
                    <TableRow key={pharmacist.id}>
                      <TableCell className="font-medium">{pharmacist.full_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {pharmacistAssignments.length === 0 ? (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          ) : (
                            pharmacistAssignments.map((assignment: any) => (
                              <Badge key={assignment.id} variant="secondary" className="flex items-center gap-1">
                                {assignment.branches.name}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={() => removeAssignment.mutate(assignment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(pharmacist.created_at).toLocaleDateString()}</TableCell>
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
