import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tag, TrendingUp } from 'lucide-react';
import { promotionsApi, branchesApi, medicinesApi } from '@/services/backendApi';
import type { Promotion, Branch, Medicine } from '@/types/backend';

export function PromotionsManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    branch_id: '',
    medicine_id: '',
    discount_percentage: '',
    promotional_price: '',
    description: '',
    valid_from: '',
    valid_until: '',
    is_featured: false,
    notification_enabled: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [promotionsData, branchesData, medicinesData] = await Promise.all([
        promotionsApi.getAll(),
        branchesApi.getAll(),
        medicinesApi.getAll()
      ]);
      setPromotions(promotionsData.promotions || []);
      setBranches(branchesData.branches || []);
      setMedicines(medicinesData.medicines || []);
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPromotion) {
        await promotionsApi.update(editingPromotion.id, formData);
        toast.success('Promotion updated successfully');
      } else {
        await promotionsApi.create(formData);
        toast.success('Promotion created successfully! Mobile users will be notified.');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error('Failed to save promotion: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      await promotionsApi.delete(id);
      toast.success('Promotion deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete promotion: ' + error.message);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      branch_id: promotion.branch_id,
      medicine_id: promotion.medicine_id,
      discount_percentage: promotion.discount_percentage.toString(),
      promotional_price: promotion.promotional_price.toString(),
      description: promotion.description,
      valid_from: promotion.valid_from.split('T')[0],
      valid_until: promotion.valid_until.split('T')[0],
      is_featured: promotion.is_featured,
      notification_enabled: false
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setFormData({
      branch_id: '',
      medicine_id: '',
      discount_percentage: '',
      promotional_price: '',
      description: '',
      valid_from: '',
      valid_until: '',
      is_featured: false,
      notification_enabled: true
    });
  };

  const calculatePromotionalPrice = (medicineId: string, discountPercentage: number) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine || !formData.branch_id) return '';
    
    // This would need to fetch branch stock price in a real implementation
    // For now, just return empty to let user input manually
    return '';
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const validFrom = new Date(promotion.valid_from);
    const validUntil = new Date(promotion.valid_until);
    return promotion.is_active && now >= validFrom && now <= validUntil;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading promotions...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Promotions & Featured Products
              </CardTitle>
              <CardDescription>
                Create promotions to attract mobile app users and increase sales
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
                    </DialogTitle>
                    <DialogDescription>
                      Promote medicines to mobile app users. They'll receive notifications about your offers.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="branch_id">Branch *</Label>
                        <Select
                          value={formData.branch_id}
                          onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medicine_id">Medicine *</Label>
                        <Select
                          value={formData.medicine_id}
                          onValueChange={(value) => setFormData({ ...formData, medicine_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select medicine" />
                          </SelectTrigger>
                          <SelectContent>
                            {medicines.map(medicine => (
                              <SelectItem key={medicine.id} value={medicine.id}>
                                {medicine.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discount_percentage">Discount % *</Label>
                        <Input
                          id="discount_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discount_percentage}
                          onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="promotional_price">Promotional Price *</Label>
                        <Input
                          id="promotional_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.promotional_price}
                          onChange={(e) => setFormData({ ...formData, promotional_price: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="e.g., Special weekend offer on antibiotics!"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valid_from">Valid From *</Label>
                        <Input
                          id="valid_from"
                          type="date"
                          value={formData.valid_from}
                          onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="valid_until">Valid Until *</Label>
                        <Input
                          id="valid_until"
                          type="date"
                          value={formData.valid_until}
                          onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="is_featured" className="text-sm font-medium">
                          Featured Promotion
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Featured promotions appear at the top of the mobile app
                        </p>
                      </div>
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                      />
                    </div>

                    {!editingPromotion && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="notification_enabled" className="text-sm font-medium">
                            Send Push Notifications
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Notify mobile users within 5km radius about this promotion
                          </p>
                        </div>
                        <Switch
                          id="notification_enabled"
                          checked={formData.notification_enabled}
                          onCheckedChange={(checked) => setFormData({ ...formData, notification_enabled: checked })}
                        />
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No promotions yet. Create your first promotion to attract customers!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{promotion.medicine?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{promotion.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{promotion.branch?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {promotion.discount_percentage}% OFF
                      </Badge>
                    </TableCell>
                    <TableCell>${promotion.promotional_price.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">
                      <div>{new Date(promotion.valid_from).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        to {new Date(promotion.valid_until).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isPromotionActive(promotion) ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {promotion.is_featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(promotion)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(promotion.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
