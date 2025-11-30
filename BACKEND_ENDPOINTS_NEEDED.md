# Backend Endpoints Implementation Guide

This document lists the new API endpoints that need to be implemented in the Node.js MongoDB backend to support the full CRUD functionality in the frontend.

## Transaction Items Endpoints

### 1. Get Transaction Items by Transaction ID
**Endpoint:** `GET /api/transaction-items/transaction/:transactionId`
**Description:** Fetch all items for a specific transaction
**Auth:** Required (JWT)
**Response:** Array of transaction items with populated medicine data

```javascript
{
  items: [
    {
      id: "item_id",
      transaction_id: "transaction_id",
      medicine_id: "medicine_id",
      quantity: 5,
      unit_price: 10.50,
      subtotal: 52.50,
      medicine: {
        name: "Medicine Name",
        brand_name: "Brand",
        unit: "box"
      }
    }
  ]
}
```

### 2. Create Transaction Item
**Endpoint:** `POST /api/transaction-items`
**Description:** Create a single transaction item
**Auth:** Required (JWT)
**Request Body:**
```javascript
{
  transaction_id: "transaction_id",
  medicine_id: "medicine_id",
  quantity: 5,
  unit_price: 10.50,
  subtotal: 52.50
}
```

### 3. Create Multiple Transaction Items (Bulk)
**Endpoint:** `POST /api/transaction-items/bulk`
**Description:** Create multiple transaction items at once
**Auth:** Required (JWT)
**Request Body:**
```javascript
{
  items: [
    {
      transaction_id: "transaction_id",
      medicine_id: "medicine_id",
      quantity: 5,
      unit_price: 10.50,
      subtotal: 52.50
    },
    // ... more items
  ]
}
```

## Alert Management Endpoints

### 4. Mark Alert as Read
**Endpoint:** `PATCH /api/alerts/:id/read`
**Description:** Mark a specific alert as read
**Auth:** Required (JWT, owner only)
**Response:**
```javascript
{
  message: "Alert marked as read",
  alert: { /* updated alert object */ }
}
```

### 5. Resolve Alert
**Endpoint:** `PATCH /api/alerts/:id/resolve`
**Description:** Mark an alert as resolved
**Auth:** Required (JWT, owner only)
**Response:**
```javascript
{
  message: "Alert resolved",
  alert: { /* updated alert object */ }
}
```

### 6. Update Alert
**Endpoint:** `PUT /api/alerts/:id`
**Description:** Update alert details
**Auth:** Required (JWT, owner only)
**Request Body:**
```javascript
{
  is_read: true,
  is_resolved: false,
  // other fields as needed
}
```

### 7. Delete Alert
**Endpoint:** `DELETE /api/alerts/:id`
**Description:** Delete an alert
**Auth:** Required (JWT, owner only)
**Response:**
```javascript
{
  message: "Alert deleted successfully"
}
```

### 8. Create Alert
**Endpoint:** `POST /api/alerts`
**Description:** Create a new alert (for system-generated alerts)
**Auth:** Required (JWT)
**Request Body:**
```javascript
{
  branch_id: "branch_id",
  medicine_id: "medicine_id",
  alert_type: "low_stock" | "expiry_warning" | "expired",
  severity: "low" | "medium" | "high" | "critical",
  title: "Alert Title",
  message: "Detailed message",
  current_quantity: 5,
  threshold_quantity: 10,
  expiry_date: "2024-12-31"
}
```

## Branch Stock Management

### 9. Delete Branch Stock Item
**Endpoint:** `DELETE /api/branch-stock/:id`
**Description:** Delete a branch stock item
**Auth:** Required (JWT, owner only)
**Response:**
```javascript
{
  message: "Stock item deleted successfully"
}
```

### 10. Create Branch Stock
**Endpoint:** `POST /api/branch-stock`
**Description:** Add stock to a branch
**Auth:** Required (JWT, owner only)
**Request Body:**
```javascript
{
  branch_id: "branch_id",
  medicine_id: "medicine_id",
  quantity: 100,
  selling_price: 15.99,
  batch_number: "BATCH123",
  expire_date: "2025-12-31"
}
```

### 11. Update Branch Stock
**Endpoint:** `PUT /api/branch-stock/:id`
**Description:** Update branch stock item
**Auth:** Required (JWT, owner only)
**Request Body:**
```javascript
{
  quantity: 150,
  selling_price: 16.99,
  // other fields
}
```

## Additional Transaction Endpoints

### 12. Get Transaction by ID
**Endpoint:** `GET /api/transactions/:id`
**Description:** Get a single transaction with populated data
**Auth:** Required (JWT)
**Response:**
```javascript
{
  id: "transaction_id",
  branch_id: "branch_id",
  pharmacist_id: "pharmacist_id",
  total_amount: 100.00,
  payment_method: "cash",
  created_at: "2024-01-15T10:30:00Z",
  branch: { name: "Main Branch" },
  pharmacist: { full_name: "John Doe" }
}
```

## Implementation Notes

### Security Considerations
1. **Authorization:** Implement proper role-based access control
   - Owners: Full CRUD access to all endpoints
   - Pharmacists: Read access only, limited to their assigned branches

2. **Input Validation:** Use express-validator for all endpoints
   ```javascript
   const { body, param } = require('express-validator');
   
   // Example validation
   body('quantity').isInt({ min: 1 }),
   body('unit_price').isFloat({ min: 0 }),
   param('id').isMongoId()
   ```

3. **Error Handling:** Return consistent error responses
   ```javascript
   {
     error: "Error message",
     code: "ERROR_CODE"
   }
   ```

### Database Models Needed

**TransactionItem Model:**
```javascript
const transactionItemSchema = new mongoose.Schema({
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  created_at: { type: Date, default: Date.now }
});
```

**Alert Model Updates:**
Ensure the Alert model has these fields:
- `is_read: Boolean (default: false)`
- `is_resolved: Boolean (default: false)`
- `resolved_by: ObjectId (ref: 'Profile')`
- `resolved_at: Date`

## Testing Checklist

- [ ] Transaction items can be fetched by transaction ID
- [ ] Bulk transaction items creation works
- [ ] Alerts can be marked as read
- [ ] Alerts can be resolved
- [ ] Alerts can be deleted
- [ ] Branch stock items can be deleted
- [ ] Proper authorization checks are in place
- [ ] Input validation prevents invalid data
- [ ] Error responses are consistent and helpful
