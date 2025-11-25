import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchStockApi, transactionsApi } from "@/services/backendApi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Trash2, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  medicine_id: string;
  medicine_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  available_stock: number;
}

export const POSSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [searchTerm, setSearchTerm] = useState("");

  // Get pharmacist's branch
  const { data: assignment } = useQuery({
    queryKey: ["pharmacist-assignment", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacist_assignments")
        .select("branch_id, branches(name)")
        .eq("pharmacist_id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch available medicines in branch
  const { data: branchStock } = useQuery({
    queryKey: ["branch-stock", assignment?.branch_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_stock")
        .select(`
          *,
          medicines (name, brand_name, unit, requires_prescription)
        `)
        .eq("branch_id", assignment?.branch_id)
        .gt("quantity", 0);
      
      if (error) throw error;
      return data;
    },
    enabled: !!assignment?.branch_id,
  });

  // Process transaction
  const processTransaction = useMutation({
    mutationFn: async () => {
      if (!assignment?.branch_id || cart.length === 0) {
        throw new Error("Cart is empty or branch not assigned");
      }

      const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          branch_id: assignment.branch_id,
          pharmacist_id: user?.id,
          payment_method: paymentMethod,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const items = cart.map((item) => ({
        transaction_id: transaction.id,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(items);

      if (itemsError) throw itemsError;

      // Update branch stock
      for (const item of cart) {
        const stockItem = branchStock?.find((s) => s.medicine_id === item.medicine_id);
        if (stockItem) {
          const { error: updateError } = await supabase
            .from("branch_stock")
            .update({
              quantity: stockItem.quantity - item.quantity,
            })
            .eq("id", stockItem.id);

          if (updateError) throw updateError;
        }
      }

      return transaction;
    },
    onSuccess: (transaction) => {
      toast({
        title: "Success",
        description: `Transaction completed. Total: $${transaction.total_amount.toFixed(2)}`,
      });
      setCart([]);
      setSelectedMedicine("");
      setQuantity("1");
      queryClient.invalidateQueries({ queryKey: ["branch-stock"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addToCart = () => {
    if (!selectedMedicine) return;

    const stockItem = branchStock?.find((s) => s.medicine_id === selectedMedicine);
    if (!stockItem) return;

    const qty = parseInt(quantity);
    if (qty <= 0 || qty > stockItem.quantity) {
      toast({
        title: "Invalid Quantity",
        description: `Available stock: ${stockItem.quantity}`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find((item) => item.medicine_id === selectedMedicine);
    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (newQty > stockItem.quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${stockItem.quantity} units available`,
          variant: "destructive",
        });
        return;
      }
      setCart(
        cart.map((item) =>
          item.medicine_id === selectedMedicine ? { ...item, quantity: newQty } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          medicine_id: selectedMedicine,
          medicine_name: stockItem.medicines.name,
          unit: stockItem.medicines.unit,
          quantity: qty,
          unit_price: Number(stockItem.selling_price),
          available_stock: stockItem.quantity,
        },
      ]);
    }

    setSelectedMedicine("");
    setQuantity("1");
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter((item) => item.medicine_id !== medicineId));
  };

  const updateCartQuantity = (medicineId: string, newQty: number) => {
    const item = cart.find((i) => i.medicine_id === medicineId);
    if (!item) return;

    if (newQty <= 0) {
      removeFromCart(medicineId);
      return;
    }

    if (newQty > item.available_stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${item.available_stock} units available`,
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map((i) => (i.medicine_id === medicineId ? { ...i, quantity: newQty } : i)));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const filteredStock = branchStock?.filter((stock) =>
    stock.medicines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.medicines.brand_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Point of Sale</h2>
        <p className="text-muted-foreground">
          Branch: {assignment?.branches?.name || "Not assigned"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Medicine Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Medicine</CardTitle>
              <CardDescription>Search and add medicines to cart</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Search Medicine</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Medicine</Label>
                  <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStock?.map((stock: any) => (
                        <SelectItem key={stock.medicine_id} value={stock.medicine_id}>
                          {stock.medicines.name}
                          {stock.medicines.brand_name && ` (${stock.medicines.brand_name})`} - ${Number(stock.selling_price).toFixed(2)} ({stock.quantity} {stock.medicines.unit} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addToCart} disabled={!selectedMedicine}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>
                <ShoppingCart className="inline h-5 w-5 mr-2" />
                Cart ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Cart is empty</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.medicine_id}>
                        <TableCell className="font-medium">{item.medicine_name}</TableCell>
                        <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            max={item.available_stock}
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartQuantity(item.medicine_id, parseInt(e.target.value))
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.medicine_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (0%)</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => processTransaction.mutate()}
                disabled={cart.length === 0 || processTransaction.isPending}
              >
                {processTransaction.isPending ? "Processing..." : "Complete Transaction"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
