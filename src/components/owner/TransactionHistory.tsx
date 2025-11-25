import { useEffect, useState } from "react";
import { transactionsApi } from "@/services/backendApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface Transaction {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  pharmacist: {
    full_name: string;
  };
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

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedPharmacist, setSelectedPharmacist] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [branches, setBranches] = useState<any[]>([]);
  const [pharmacists, setPharmacists] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBranches();
    fetchPharmacists();
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, selectedBranch, selectedPharmacist, startDate, endDate]);

  const fetchBranches = async () => {
    const { data } = await supabase
      .from("branches")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    
    if (data) setBranches(data);
  };

  const fetchPharmacists = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "pharmacist")
      .order("full_name");
    
    if (data) setPharmacists(data);
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          created_at,
          total_amount,
          payment_method,
          pharmacist:profiles!transactions_pharmacist_id_fkey(full_name),
          branch:branches(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
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
      const { data, error } = await supabase
        .from("transaction_items")
        .select(`
          quantity,
          unit_price,
          subtotal,
          medicine:medicines(name)
        `)
        .eq("transaction_id", transactionId);

      if (error) throw error;
      setTransactionItems(data || []);
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
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.pharmacist?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBranch !== "all") {
      filtered = filtered.filter((t) => t.branch?.name === selectedBranch);
    }

    if (selectedPharmacist !== "all") {
      filtered = filtered.filter((t) => t.pharmacist?.full_name === selectedPharmacist);
    }

    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.created_at) >= new Date(startDate));
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.created_at) <= endDateTime);
    }

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

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
            <p className="text-muted-foreground">Monitor all pharmacy transactions</p>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl">${totalRevenue.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by pharmacist or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.name}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPharmacist} onValueChange={setSelectedPharmacist}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by pharmacist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pharmacists</SelectItem>
                {pharmacists.map((pharmacist) => (
                  <SelectItem key={pharmacist.id} value={pharmacist.full_name}>
                    {pharmacist.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="start-date" className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date" className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedBranch("all");
                setSelectedPharmacist("all");
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Pharmacist</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.pharmacist?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>{transaction.branch?.name || "Unknown"}</TableCell>
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
                    <TableCell>{item.medicine?.name || "Unknown"}</TableCell>
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
