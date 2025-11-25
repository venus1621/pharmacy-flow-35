// Type definitions for MongoDB backend models

export interface Profile {
  id: string; // MongoDB _id mapped to id for frontend compatibility
  email: string;
  full_name: string;
  role: 'owner' | 'pharmacist';
  created_at: string;
}

export interface Pharmacy {
  id: string;
  owner_id: string;
  name: string;
  address?: string;
  phone?: string;
  plan: 'small_business' | 'enterprise' | 'startup';
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  pharmacy_id: string;
  name: string;
  location: string;
  phone?: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  brand_name?: string;
  category: string;
  description?: string;
  manufacturer?: string;
  unit: string;
  requires_prescription: boolean;
  created_at: string;
  updated_at: string;
}

export interface MainStock {
  id: string;
  medicine_id: string | Medicine;
  quantity: number;
  purchase_price: number;
  batch_number?: string;
  manufacture_date?: string;
  expire_date: string;
  created_at: string;
  updated_at: string;
}

export interface BranchStock {
  id: string;
  branch_id: string | Branch;
  medicine_id: string | Medicine;
  quantity: number;
  selling_price: number;
  batch_number?: string;
  expire_date: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  branch_id: string | Branch;
  pharmacist_id: string | Profile;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string | Transaction;
  medicine_id: string | Medicine;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  branch_id: string | Branch;
  medicine_id: string | Medicine;
  quantity: number;
  requested_by: string | Profile;
  approved_by?: string | Profile;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approved_at?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  branch_id?: string | Branch;
  medicine_id?: string | Medicine;
  stock_id?: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  current_quantity?: number;
  threshold_quantity?: number;
  expiry_date?: string;
  is_read: boolean;
  is_resolved: boolean;
  resolved_by?: string | Profile;
  resolved_at?: string;
  created_at: string;
}

export interface PharmacistAssignment {
  id: string;
  pharmacist_id: string | Profile;
  branch_id: string | Branch;
  assigned_at: string;
}

export interface AuthResponse {
  user: Profile;
  token: string;
}
