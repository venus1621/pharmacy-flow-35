import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string | null;
  is_active: boolean;
}

export const BranchManagement = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phone: "",
    is_active: true
  });

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load branches");
    } else {
      setBranches(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingBranch) {
      const { error } = await supabase
        .from("branches")
        .update(formData)
        .eq("id", editingBranch.id);

      if (error) {
        toast.error("Failed to update branch");
      } else {
        toast.success("Branch updated successfully");
        setDialogOpen(false);
        fetchBranches();
      }
    } else {
      const { error } = await supabase
        .from("branches")
        .insert([formData]);

      if (error) {
        toast.error("Failed to create branch");
      } else {
        toast.success("Branch created successfully");
        setDialogOpen(false);
        fetchBranches();
      }
    }
    setLoading(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete branch");
    } else {
      toast.success("Branch deleted successfully");
      fetchBranches();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", location: "", phone: "", is_active: true });
    setEditingBranch(null);
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      phone: branch.phone || "",
      is_active: branch.is_active
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Branch Management</CardTitle>
            <CardDescription>Manage your pharmacy branches</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
                <DialogDescription>
                  {editingBranch ? "Update branch details" : "Create a new branch location"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {editingBranch ? "Update Branch" : "Create Branch"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {branches.map((branch) => (
            <div key={branch.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${branch.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                  <MapPin className={`h-5 w-5 ${branch.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="font-medium">{branch.name}</h3>
                  <p className="text-sm text-muted-foreground">{branch.location}</p>
                  {branch.phone && <p className="text-sm text-muted-foreground">{branch.phone}</p>}
                  <span className={`text-xs ${branch.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                    {branch.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(branch)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(branch.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {branches.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">No branches yet. Create your first branch to get started.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
