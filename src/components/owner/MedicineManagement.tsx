import { useState, useEffect } from "react";
import { medicinesApi } from "@/services/backendApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Pill } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Medicine {
  id: string;
  name: string;
  brand_name: string | null;
  category: string;
  manufacturer: string | null;
  description: string | null;
  unit: string;
  requires_prescription: boolean;
}

export const MedicineManagement = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    brand_name: "",
    category: "",
    manufacturer: "",
    description: "",
    unit: "box",
    requires_prescription: false
  });

  const fetchMedicines = async () => {
    try {
      const data = await medicinesApi.getAll();
      setMedicines(data || []);
    } catch (error) {
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingMedicine) {
        await medicinesApi.update(editingMedicine.id, formData);
        toast.success("Medicine updated successfully");
      } else {
        await medicinesApi.create(formData);
        toast.success("Medicine added successfully");
      }
      setDialogOpen(false);
      fetchMedicines();
      resetForm();
    } catch (error) {
      toast.error(editingMedicine ? "Failed to update medicine" : "Failed to add medicine");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    try {
      await medicinesApi.delete(id);
      toast.success("Medicine deleted successfully");
      fetchMedicines();
    } catch (error) {
      toast.error("Failed to delete medicine");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      brand_name: "",
      category: "",
      manufacturer: "",
      description: "",
      unit: "box",
      requires_prescription: false
    });
    setEditingMedicine(null);
  };

  const openEditDialog = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      brand_name: medicine.brand_name || "",
      category: medicine.category,
      manufacturer: medicine.manufacturer || "",
      description: medicine.description || "",
      unit: medicine.unit,
      requires_prescription: medicine.requires_prescription
    });
    setDialogOpen(true);
  };

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Medicine Catalog</CardTitle>
            <CardDescription>Manage your medicine inventory</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
                <DialogDescription>
                  {editingMedicine ? "Update medicine details" : "Add a new medicine to the catalog"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Medicine Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand_name">Brand Name</Label>
                    <Input
                      id="brand_name"
                      value={formData.brand_name}
                      onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="strip">Strip</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="vial">Vial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_prescription"
                    checked={formData.requires_prescription}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_prescription: checked })}
                  />
                  <Label htmlFor="requires_prescription">Requires Prescription</Label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {editingMedicine ? "Update Medicine" : "Add Medicine"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          {filteredMedicines.map((medicine) => (
            <div key={medicine.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{medicine.name}</h3>
                  {medicine.brand_name && (
                    <p className="text-sm font-medium text-primary">{medicine.brand_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {medicine.category} • {medicine.unit}
                    {medicine.manufacturer && ` • ${medicine.manufacturer}`}
                  </p>
                  {medicine.requires_prescription && (
                    <span className="text-xs text-warning">⚠ Requires Prescription</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(medicine)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(medicine.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {filteredMedicines.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? "No medicines found matching your search." : "No medicines yet. Add your first medicine to get started."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
