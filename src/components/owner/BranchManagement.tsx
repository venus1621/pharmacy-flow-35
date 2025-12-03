import { useState, useEffect } from "react";
import { branchesApi } from "@/services/backendApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MapPin, Navigation } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string | null;
  is_active: boolean;
  latitude?: number | null;
  longitude?: number | null;
  operating_hours?: string | null;
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
    is_active: true,
    latitude: "",
    longitude: "",
    operating_hours: ""
  });

  const fetchBranches = async () => {
    try {
      const data = await branchesApi.getAll();
      setBranches(data || []);
    } catch (error) {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submitData = {
      name: formData.name,
      location: formData.location,
      phone: formData.phone || null,
      is_active: formData.is_active,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      operating_hours: formData.operating_hours || null
    };

    try {
      if (editingBranch) {
        await branchesApi.update(editingBranch.id, submitData);
        toast.success("Branch updated successfully");
      } else {
        await branchesApi.create(submitData);
        toast.success("Branch created successfully");
      }
      setDialogOpen(false);
      fetchBranches();
      resetForm();
    } catch (error) {
      toast.error(editingBranch ? "Failed to update branch" : "Failed to create branch");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    try {
      await branchesApi.delete(id);
      toast.success("Branch deleted successfully");
      fetchBranches();
    } catch (error) {
      toast.error("Failed to delete branch");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", location: "", phone: "", is_active: true, latitude: "", longitude: "", operating_hours: "" });
    setEditingBranch(null);
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      phone: branch.phone || "",
      is_active: branch.is_active,
      latitude: branch.latitude?.toString() || "",
      longitude: branch.longitude?.toString() || "",
      operating_hours: branch.operating_hours || ""
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
                <div className="space-y-2">
                  <Label htmlFor="operating_hours">Operating Hours</Label>
                  <Input
                    id="operating_hours"
                    placeholder="e.g., 9 AM - 9 PM"
                    value={formData.operating_hours}
                    onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>GPS Coordinates</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setFormData({
                                ...formData,
                                latitude: position.coords.latitude.toFixed(6),
                                longitude: position.coords.longitude.toFixed(6)
                              });
                              toast.success("Location captured!");
                            },
                            () => toast.error("Unable to get location")
                          );
                        } else {
                          toast.error("Geolocation not supported");
                        }
                      }}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Get Current
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="latitude" className="text-xs text-muted-foreground">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 9.0192"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude" className="text-xs text-muted-foreground">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 38.7525"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      />
                    </div>
                  </div>
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
                  {branch.operating_hours && (
                    <p className="text-xs text-muted-foreground">Hours: {branch.operating_hours}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${branch.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {branch.latitude && branch.longitude ? (
                      <span className="text-xs text-primary flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        GPS Set
                      </span>
                    ) : (
                      <span className="text-xs text-amber-500">No GPS</span>
                    )}
                  </div>
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
