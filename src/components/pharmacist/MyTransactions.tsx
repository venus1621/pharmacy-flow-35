import { useEffect, useState } from "react";
import { transactionsApi } from "@/services/backendApi";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Eye, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  branch: {
    name: string;
  };
}

interface TransactionItem {
  quantity: number;
  unit_price: number;
  subtotal: number;
  medicine: {
    name: string;
  };
}

export function MyTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm]);

  const fetchTransactions = async () => {
    try {
      const data = await transactionsApi.getAll();
      // Filter by current user (pharmacist)
      const myTransactions = data.filter((t: any) => t.pharmacist_id === user!.id);
      setTransactions(myTransactions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionDetails = async (transactionId: string) => {
    setDetailsLoading(true);
    try {
      // Note: Backend doesn't have transaction items endpoint yet
      toast({
        title: "Info",
        description: "Transaction details feature requires backend implementation",
      });
      setTransactionItems([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const filterTransactions = () => {
    if (!searchTerm) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(
      (t) =>
        t.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredTransactions(filtered);
  };

  const handleViewDetails = (transactionId: string) => {
    setSelectedTransaction(transactionId);
    fetchTransactionDetails(transactionId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalSales = filteredTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Transactions</h2>
            <p className="text-muted-foreground">View your sales history</p>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sales</CardDescription>
              <CardTitle className="text-2xl">${totalSales.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No transactions found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.branch.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.payment_method}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${Number(transaction.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(transaction.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.medicine.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${Number(item.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${Number(item.subtotal).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
