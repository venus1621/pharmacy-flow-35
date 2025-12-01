// MongoDB Backend API Service
// const API_URL = import.meta.env.VITE_API_URL || 'https://newpharmacy.onrender.com';
// const API_URL ='https://newpharmacy.onrender.com';

const API_URL ='http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Helper function to set auth headers
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Auth API
export const authApi = {
  // ---------------------------------------
  // SIGN UP
  // ---------------------------------------
  signUp: async (data: { 
    email: string; 
    password: string; 
    full_name: string; 
    role?: string;
    pharmacy_name?: string;
    pharmacy_address?: string;
    pharmacy_phone?: string;
  }) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    // Better error handling
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Sign up failed");
    }

    const result = await response.json();
    console.log(result.token);
    localStorage.setItem("auth_token", result.token); // Save JWT

    return result;
  },

  // ---------------------------------------
  // SIGN IN
  // ---------------------------------------
  signIn: async (data: { email: string; password: string }) => {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Sign in failed");
    }

    const result = await response.json();
    localStorage.setItem("auth_token", result.token);

    return result;
  },

  // ---------------------------------------
  // SIGN OUT
  // ---------------------------------------
  signOut: async () => {
    const token = getAuthToken();

    // Make sure token exists
    if (token) {
      await fetch(`${API_URL}/auth/signout`, {
        method: "POST",
        headers: getHeaders(),
      });
    }

    localStorage.removeItem("auth_token");
  },

  // ---------------------------------------
  // GET CURRENT SESSION
  // ---------------------------------------
  getSession: async () => {
    const response = await fetch(`${API_URL}/auth/session`, {
      headers: getHeaders(),
    });

    if (!response.ok) return null;

    return await response.json();
  }
};

// Profiles API
export const profilesApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/profiles`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch profiles');
    return await response.json();
  },

  create: async (data: { email: string; password: string; full_name: string; role?: string }) => {
    const response = await fetch(`${API_URL}/profiles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create profile');
    return await response.json();
  },

  update: async (id: string, data: { full_name: string }) => {
    const response = await fetch(`${API_URL}/profiles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return await response.json();
  }
};

// Pharmacies API
export const pharmaciesApi = {
  get: async () => {
    const response = await fetch(`${API_URL}/pharmacies`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch pharmacy');
    return await response.json();
  },

  create: async (data: { name: string; address?: string; phone?: string; plan?: string }) => {
    const response = await fetch(`${API_URL}/pharmacies`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create pharmacy');
    return await response.json();
  }
};

// Branches API
export const branchesApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/branches`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch branches');
    return await response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create branch');
    return await response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/branches/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update branch');
    return await response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/branches/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete branch');
    return await response.json();
  }
};

// Medicines API
export const medicinesApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/medicines`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch medicines');
    return await response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/medicines`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create medicine');
    return await response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/medicines/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update medicine');
    return await response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/medicines/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete medicine');
    return await response.json();
  }
};

// Main Stock API
export const mainStockApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/main-stock`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch main stock');
    return await response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/main-stock`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create stock');
    return await response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/main-stock/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update stock');
    return await response.json();
  }
};

// Branch Stock API
export const branchStockApi = {
  getByBranch: async (branchId: string) => {
    const response = await fetch(`${API_URL}/branch-stock/branch/${branchId}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch branch stock');
    return await response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_URL}/branch-stock`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch branch stock');
    return await response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/branch-stock`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create branch stock');
    return await response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/branch-stock/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update branch stock');
    return await response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/branch-stock/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete branch stock');
    return await response.json();
  }
};

// Transactions API
export const transactionsApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/transactions`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return await response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch transaction');
    return await response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create transaction');
    return await response.json();
  }
};

// Transaction Items API
export const transactionItemsApi = {
  getByTransaction: async (transactionId: string) => {
    const response = await fetch(`${API_URL}/transaction-items/transaction/${transactionId}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch transaction items');
    return await response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/transaction-items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create transaction item');
    return await response.json();
  },

  createBulk: async (items: any[]) => {
    const response = await fetch(`${API_URL}/transaction-items/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items })
    });
    if (!response.ok) throw new Error('Failed to create transaction items');
    return await response.json();
  }
};

// Stock Transfers API
export const stockTransfersApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/stock-transfers`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch transfers');
    return await response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/stock-transfers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create transfer');
    return await response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/stock-transfers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update transfer');
    return await response.json();
  }
};

// Alerts API
export const alertsApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/alerts`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch alerts');
    return await response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/alerts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create alert');
    return await response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/alerts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update alert');
    return await response.json();
  },

  markAsRead: async (id: string) => {
    const response = await fetch(`${API_URL}/alerts/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to mark alert as read');
    return await response.json();
  },

  resolve: async (id: string) => {
    const response = await fetch(`${API_URL}/alerts/${id}/resolve`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to resolve alert');
    return await response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/alerts/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete alert');
    return await response.json();
  }
};

// Pharmacist Assignments API
export const assignmentsApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/pharmacist-assignments`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return await response.json();
  },

  create: async (data: { pharmacist_id: string; branch_id: string }) => {
    const response = await fetch(`${API_URL}/pharmacist-assignments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create assignment');
    return await response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/pharmacist-assignments/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete assignment');
    return await response.json();
  }
};

// Promotions Management (Owner)
export const promotionsApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/promotions/my-promotions`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch promotions');
    return await response.json();
  },
  
  create: async (data: any) => {
    const response = await fetch(`${API_URL}/promotions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create promotion');
    return await response.json();
  },
  
  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/promotions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update promotion');
    return await response.json();
  },
  
  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/promotions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete promotion');
    return await response.json();
  }
};

// Mobile API - Public Search (no auth required for basic search)
export const mobileApi = {
  searchMedicines: async (query: string, lat?: number, lng?: number, radius?: number) => {
    const params = new URLSearchParams({ q: query });
    if (lat) params.append('lat', lat.toString());
    if (lng) params.append('lng', lng.toString());
    if (radius) params.append('radius', radius.toString());
    
    const response = await fetch(`${API_URL}/mobile/medicines/search?${params}`);
    if (!response.ok) throw new Error('Failed to search medicines');
    return await response.json();
  },
  
  getMedicineDetails: async (id: string, lat?: number, lng?: number) => {
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat.toString());
    if (lng) params.append('lng', lng.toString());
    
    const url = params.toString() 
      ? `${API_URL}/mobile/medicines/${id}?${params}`
      : `${API_URL}/mobile/medicines/${id}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get medicine details');
    return await response.json();
  },
  
  searchPharmacies: async (lat: number, lng: number, radius?: number, query?: string) => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString()
    });
    if (radius) params.append('radius', radius.toString());
    if (query) params.append('q', query);
    
    const response = await fetch(`${API_URL}/mobile/pharmacies/search?${params}`);
    if (!response.ok) throw new Error('Failed to search pharmacies');
    return await response.json();
  },
  
  getBranchMedicines: async (branchId: string, category?: string, inStock?: boolean) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (inStock !== undefined) params.append('in_stock', inStock.toString());
    
    const url = params.toString()
      ? `${API_URL}/mobile/branches/${branchId}/medicines?${params}`
      : `${API_URL}/mobile/branches/${branchId}/medicines`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get branch medicines');
    return await response.json();
  },
  
  getPromotions: async (lat?: number, lng?: number, category?: string) => {
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat.toString());
    if (lng) params.append('lng', lng.toString());
    if (category) params.append('category', category);
    
    const url = params.toString()
      ? `${API_URL}/mobile/promotions?${params}`
      : `${API_URL}/mobile/promotions`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get promotions');
    return await response.json();
  }
};
