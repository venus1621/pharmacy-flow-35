import { useState, useEffect } from "react";
import { mainStockApi, medicinesApi } from "@/services/backendApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface MainStock {
  id: string;
  medicine_id: string;
  quantity: number;
  batch_number: string | null;
  manufacture_date: string | null;
  expire_date: string;
  purchase_price: number;
  medicines: {
    name: string;
    brand_name: string | null;
    category: string;
    unit: string;
  };
}

interface Medicine {
  id: string;
  name: string;
  brand_name: string | null;
  category: string;
  unit: string;
}

export const MainStockManagement = () => {
  const [stocks, setStocks] = useState<MainStock[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    medicine_id: "",
    quantity: "",
    batch_number: "",
    manufacture_date: "",
    expire_date: "",
    purchase_price: ""
  });

  const fetchData = async () => {
    try {
      const [stocks, meds] = await Promise.all([
        mainStockApi.getAll(),
        medicinesApi.getAll()
      ]);
      setStocks(stocks || []);
      setMedicines(meds || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await mainStockApi.create({
        medicine_id: formData.medicine_id,
        quantity: parseInt(formData.quantity),
        batch_number: formData.batch_number || null,
        manufacture_date: formData.manufacture_date || null,
        expire_date: formData.expire_date,
        purchase_price: parseFloat(formData.purchase_price)
      });
      toast.success("Stock added successfully");
      setDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error("Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      medicine_id: "",
      quantity: "",
      batch_number: "",
      manufacture_date: "",
      expire_date: "",
      purchase_price: ""
    });
  };

  const isExpiringSoon = (expireDate: string) => {
    const daysUntilExpiry = Math.floor((new Date(expireDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expireDate: string) => {
    return new Date(expireDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Main Stock Management</CardTitle>
            <CardDescription>Manage your main warehouse inventory</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Stock to Main Warehouse</DialogTitle>
                <DialogDescription>Add new stock entry to the main warehouse</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medicine_id">Medicine</Label>
                  <Select value={formData.medicine_id} onValueChange={(value) => setFormData({ ...formData, medicine_id: value })}>
                    <SelectTrigger id="medicine_id">
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map((med) => (
                        <SelectItem key={med.id} value={med.id}>
                          {med.name} ({med.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase Price</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch_number">Batch Number</Label>
                  <Input
                    id="batch_number"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacture_date">Manufacture Date</Label>
                    <Input
                      id="manufacture_date"
                      type="date"
                      value={formData.manufacture_date}
                      onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expire_date">Expiry Date</Label>
                    <Input
                      id="expire_date"
                      type="date"
                      value={formData.expire_date}
                      onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Add Stock
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stocks.map((stock) => {
            const expired = isExpired(stock.expire_date);
            const expiringSoon = isExpiringSoon(stock.expire_date);
            
            return (
              <div 
                key={stock.id} 
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  expired ? 'border-destructive bg-destructive/5' : 
                  expiringSoon ? 'border-warning bg-warning/5' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    expired ? 'bg-destructive/10' : 
                    expiringSoon ? 'bg-warning/10' : 
                    'bg-primary/10'
                  }`}>
                    {expired || expiringSoon ? (
                      <AlertTriangle className={`h-5 w-5 ${expired ? 'text-destructive' : 'text-warning'}`} />
                    ) : (
                      <Package className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{stock.medicines.name}</h3>
                    {stock.medicines.brand_name && (
                      <p className="text-sm font-medium text-primary">{stock.medicines.brand_name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {stock.medicines.category} • Qty: {stock.quantity} {stock.medicines.unit}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stock.batch_number && `Batch: ${stock.batch_number} • `}
                      Exp: {format(new Date(stock.expire_date), "MMM dd, yyyy")}
                    </p>
                    {expired && <span className="text-xs text-destructive">⚠ Expired</span>}
                    {expiringSoon && !expired && <span className="text-xs text-warning">⚠ Expiring Soon</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${stock.purchase_price}</p>
                  <p className="text-sm text-muted-foreground">purchase price</p>
                </div>
              </div>
            );
          })}
          {stocks.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">No stock entries yet. Add stock to get started.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
