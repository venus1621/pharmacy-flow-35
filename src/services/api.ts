import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Tables = Database['public']['Tables'];
type Profile = Tables['profiles']['Row'];
type Pharmacy = Tables['pharmacies']['Row'];
type Branch = Tables['branches']['Row'];
type Medicine = Tables['medicines']['Row'];
type MainStock = Tables['main_stock']['Row'];
type BranchStock = Tables['branch_stock']['Row'];
type Transaction = Tables['transactions']['Row'];
type TransactionItem = Tables['transaction_items']['Row'];
type StockTransfer = Tables['stock_transfers']['Row'];
type Alert = Tables['alerts']['Row'];
type PharmacistAssignment = Tables['pharmacist_assignments']['Row'];

// ==================== AUTH APIS ====================
export const authApi = {
  signUp: async (email: string, password: string, metadata: { full_name: string; role: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// ==================== PROFILE APIS ====================
export const profileApi = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return { data, error };
  },

  createProfile: async (profile: Tables['profiles']['Insert']) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: Tables['profiles']['Update']) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  getAllProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  }
};

// ==================== PHARMACY APIS ====================
export const pharmacyApi = {
  getPharmacy: async (ownerId: string) => {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();
    return { data, error };
  },

  createPharmacy: async (pharmacy: Tables['pharmacies']['Insert']) => {
    const { data, error } = await supabase
      .from('pharmacies')
      .insert(pharmacy)
      .select()
      .single();
    return { data, error };
  },

  updatePharmacy: async (pharmacyId: string, updates: Tables['pharmacies']['Update']) => {
    const { data, error } = await supabase
      .from('pharmacies')
      .update(updates)
      .eq('id', pharmacyId)
      .select()
      .single();
    return { data, error };
  }
};

// ==================== BRANCH APIS ====================
export const branchApi = {
  getAllBranches: async () => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getBranch: async (branchId: string) => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single();
    return { data, error };
  },

  createBranch: async (branch: Tables['branches']['Insert']) => {
    const { data, error } = await supabase
      .from('branches')
      .insert(branch)
      .select()
      .single();
    return { data, error };
  },

  updateBranch: async (branchId: string, updates: Tables['branches']['Update']) => {
    const { data, error } = await supabase
      .from('branches')
      .update(updates)
      .eq('id', branchId)
      .select()
      .single();
    return { data, error };
  },

  deleteBranch: async (branchId: string) => {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', branchId);
    return { error };
  }
};

// ==================== MEDICINE APIS ====================
export const medicineApi = {
  getAllMedicines: async () => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .order('name', { ascending: true });
    return { data, error };
  },

  getMedicine: async (medicineId: string) => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('id', medicineId)
      .single();
    return { data, error };
  },

  createMedicine: async (medicine: Tables['medicines']['Insert']) => {
    const { data, error } = await supabase
      .from('medicines')
      .insert(medicine)
      .select()
      .single();
    return { data, error };
  },

  updateMedicine: async (medicineId: string, updates: Tables['medicines']['Update']) => {
    const { data, error } = await supabase
      .from('medicines')
      .update(updates)
      .eq('id', medicineId)
      .select()
      .single();
    return { data, error };
  },

  deleteMedicine: async (medicineId: string) => {
    const { error } = await supabase
      .from('medicines')
      .delete()
      .eq('id', medicineId);
    return { error };
  }
};

// ==================== MAIN STOCK APIS ====================
export const mainStockApi = {
  getAllStock: async () => {
    const { data, error } = await supabase
      .from('main_stock')
      .select(`
        *,
        medicines:medicine_id (*)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getStockByMedicine: async (medicineId: string) => {
    const { data, error } = await supabase
      .from('main_stock')
      .select('*')
      .eq('medicine_id', medicineId);
    return { data, error };
  },

  createStock: async (stock: Tables['main_stock']['Insert']) => {
    const { data, error } = await supabase
      .from('main_stock')
      .insert(stock)
      .select()
      .single();
    return { data, error };
  },

  updateStock: async (stockId: string, updates: Tables['main_stock']['Update']) => {
    const { data, error } = await supabase
      .from('main_stock')
      .update(updates)
      .eq('id', stockId)
      .select()
      .single();
    return { data, error };
  },

  deleteStock: async (stockId: string) => {
    const { error } = await supabase
      .from('main_stock')
      .delete()
      .eq('id', stockId);
    return { error };
  }
};

// ==================== BRANCH STOCK APIS ====================
export const branchStockApi = {
  getStockByBranch: async (branchId: string) => {
    const { data, error } = await supabase
      .from('branch_stock')
      .select(`
        *,
        medicines:medicine_id (*)
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getAllBranchStock: async () => {
    const { data, error } = await supabase
      .from('branch_stock')
      .select(`
        *,
        medicines:medicine_id (*),
        branches:branch_id (*)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createBranchStock: async (stock: Tables['branch_stock']['Insert']) => {
    const { data, error } = await supabase
      .from('branch_stock')
      .insert(stock)
      .select()
      .single();
    return { data, error };
  },

  updateBranchStock: async (stockId: string, updates: Tables['branch_stock']['Update']) => {
    const { data, error } = await supabase
      .from('branch_stock')
      .update(updates)
      .eq('id', stockId)
      .select()
      .single();
    return { data, error };
  },

  deleteBranchStock: async (stockId: string) => {
    const { error } = await supabase
      .from('branch_stock')
      .delete()
      .eq('id', stockId);
    return { error };
  }
};

// ==================== TRANSACTION APIS ====================
export const transactionApi = {
  getAllTransactions: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        branches:branch_id (*),
        profiles:pharmacist_id (*)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getTransactionsByPharmacist: async (pharmacistId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        branches:branch_id (*)
      `)
      .eq('pharmacist_id', pharmacistId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createTransaction: async (transaction: Tables['transactions']['Insert']) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    return { data, error };
  },

  getTransactionItems: async (transactionId: string) => {
    const { data, error } = await supabase
      .from('transaction_items')
      .select(`
        *,
        medicines:medicine_id (*)
      `)
      .eq('transaction_id', transactionId);
    return { data, error };
  },

  createTransactionItem: async (item: Tables['transaction_items']['Insert']) => {
    const { data, error } = await supabase
      .from('transaction_items')
      .insert(item)
      .select()
      .single();
    return { data, error };
  }
};

// ==================== STOCK TRANSFER APIS ====================
export const stockTransferApi = {
  getAllTransfers: async () => {
    const { data, error } = await supabase
      .from('stock_transfers')
      .select(`
        *,
        branches:branch_id (*),
        medicines:medicine_id (*),
        requested_by_profile:requested_by (*),
        approved_by_profile:approved_by (*)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getTransfersByPharmacist: async (pharmacistId: string) => {
    const { data, error } = await supabase
      .from('stock_transfers')
      .select(`
        *,
        branches:branch_id (*),
        medicines:medicine_id (*)
      `)
      .eq('requested_by', pharmacistId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createTransfer: async (transfer: Tables['stock_transfers']['Insert']) => {
    const { data, error } = await supabase
      .from('stock_transfers')
      .insert(transfer)
      .select()
      .single();
    return { data, error };
  },

  updateTransfer: async (transferId: string, updates: Tables['stock_transfers']['Update']) => {
    const { data, error } = await supabase
      .from('stock_transfers')
      .update(updates)
      .eq('id', transferId)
      .select()
      .single();
    return { data, error };
  }
};

// ==================== ALERT APIS ====================
export const alertApi = {
  getAllAlerts: async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        branches:branch_id (*),
        medicines:medicine_id (*)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getAlertsByBranch: async (branchId: string) => {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        medicines:medicine_id (*)
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateAlert: async (alertId: string, updates: Tables['alerts']['Update']) => {
    const { data, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single();
    return { data, error };
  },

  markAsRead: async (alertId: string) => {
    const { data, error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId)
      .select()
      .single();
    return { data, error };
  },

  markAsResolved: async (alertId: string, userId: string) => {
    const { data, error } = await supabase
      .from('alerts')
      .update({ 
        is_resolved: true, 
        resolved_at: new Date().toISOString(),
        resolved_by: userId 
      })
      .eq('id', alertId)
      .select()
      .single();
    return { data, error };
  }
};

// ==================== PHARMACIST ASSIGNMENT APIS ====================
export const pharmacistAssignmentApi = {
  getAssignmentsByPharmacist: async (pharmacistId: string) => {
    const { data, error } = await supabase
      .from('pharmacist_assignments')
      .select(`
        *,
        branches:branch_id (
          *,
          pharmacies:pharmacy_id (*)
        )
      `)
      .eq('pharmacist_id', pharmacistId);
    return { data, error };
  },

  getAllAssignments: async () => {
    const { data, error } = await supabase
      .from('pharmacist_assignments')
      .select(`
        *,
        branches:branch_id (*),
        profiles:pharmacist_id (*)
      `)
      .order('assigned_at', { ascending: false });
    return { data, error };
  },

  createAssignment: async (assignment: Tables['pharmacist_assignments']['Insert']) => {
    const { data, error } = await supabase
      .from('pharmacist_assignments')
      .insert(assignment)
      .select()
      .single();
    return { data, error };
  },

  deleteAssignment: async (assignmentId: string) => {
    const { error } = await supabase
      .from('pharmacist_assignments')
      .delete()
      .eq('id', assignmentId);
    return { error };
  }
};

// Export all APIs
export const api = {
  auth: authApi,
  profile: profileApi,
  pharmacy: pharmacyApi,
  branch: branchApi,
  medicine: medicineApi,
  mainStock: mainStockApi,
  branchStock: branchStockApi,
  transaction: transactionApi,
  stockTransfer: stockTransferApi,
  alert: alertApi,
  pharmacistAssignment: pharmacistAssignmentApi,
};

export default api;
