# Mobile Application API Endpoints

This document outlines the public-facing API endpoints for the mobile application that allows users to search medicines, find pharmacies, and view promotions.

## User Management

### 1. Register Mobile User
**Endpoint:** `POST /api/mobile/auth/register`
**Description:** Register a new mobile app user
**Auth:** None (public)
**Request Body:**
```javascript
{
  full_name: "John Doe",
  email: "user@example.com",
  password: "securepassword",
  phone: "+1234567890",
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: "New York, NY"
  }
}
```

### 2. Login Mobile User
**Endpoint:** `POST /api/mobile/auth/login`
**Description:** Login mobile user and get JWT token
**Auth:** None (public)
**Request Body:**
```javascript
{
  email: "user@example.com",
  password: "securepassword"
}
```

## Medicine Search

### 3. Search Medicines
**Endpoint:** `GET /api/mobile/medicines/search`
**Description:** Search for medicines across all pharmacies
**Auth:** Optional (JWT)
**Query Parameters:**
- `q` (string): Search query
- `category` (string): Filter by category
- `lat` (number): User latitude for location-based sorting
- `lng` (number): User longitude for location-based sorting
- `radius` (number): Search radius in kilometers (default: 10)

**Response:**
```javascript
{
  medicines: [
    {
      id: "medicine_id",
      name: "Medicine Name",
      brand_name: "Brand",
      category: "Antibiotics",
      description: "Description",
      requires_prescription: false,
      availability: [
        {
          branch_id: "branch_id",
          branch_name: "Main Branch",
          pharmacy_name: "City Pharmacy",
          location: {
            address: "123 Main St",
            latitude: 40.7128,
            longitude: -74.0060,
            distance_km: 2.5
          },
          quantity: 50,
          selling_price: 15.99,
          in_stock: true
        }
      ],
      is_promoted: true,
      promotion: {
        discount_percentage: 10,
        special_price: 14.39,
        valid_until: "2024-12-31"
      }
    }
  ]
}
```

### 4. Get Medicine Details
**Endpoint:** `GET /api/mobile/medicines/:id`
**Description:** Get detailed information about a specific medicine
**Auth:** Optional (JWT)
**Response:**
```javascript
{
  medicine: {
    id: "medicine_id",
    name: "Medicine Name",
    brand_name: "Brand",
    category: "Antibiotics",
    description: "Detailed description",
    manufacturer: "Pharma Corp",
    unit: "box",
    requires_prescription: false,
    available_at: [
      {
        branch_id: "branch_id",
        branch_name: "Main Branch",
        pharmacy_id: "pharmacy_id",
        pharmacy_name: "City Pharmacy",
        pharmacy_phone: "+1234567890",
        location: {
          address: "123 Main St",
          latitude: 40.7128,
          longitude: -74.0060,
          distance_km: 2.5
        },
        quantity: 50,
        selling_price: 15.99,
        batch_number: "BATCH123",
        expire_date: "2025-12-31"
      }
    ]
  }
}
```

## Pharmacy & Branch Search

### 5. Search Pharmacies
**Endpoint:** `GET /api/mobile/pharmacies/search`
**Description:** Search for pharmacies by location
**Auth:** Optional (JWT)
**Query Parameters:**
- `lat` (number): User latitude
- `lng` (number): User longitude
- `radius` (number): Search radius in kilometers (default: 10)
- `q` (string): Search query for pharmacy name

**Response:**
```javascript
{
  pharmacies: [
    {
      id: "pharmacy_id",
      name: "City Pharmacy",
      phone: "+1234567890",
      address: "123 Main St",
      branches: [
        {
          id: "branch_id",
          name: "Main Branch",
          location: {
            address: "123 Main St",
            latitude: 40.7128,
            longitude: -74.0060,
            distance_km: 2.5
          },
          phone: "+1234567890",
          is_active: true,
          operating_hours: "9 AM - 9 PM",
          medicines_count: 150
        }
      ]
    }
  ]
}
```

### 6. Get Branch Medicines
**Endpoint:** `GET /api/mobile/branches/:branchId/medicines`
**Description:** Get all available medicines at a specific branch
**Auth:** Optional (JWT)
**Query Parameters:**
- `category` (string): Filter by category
- `in_stock` (boolean): Show only in-stock items

**Response:**
```javascript
{
  branch: {
    id: "branch_id",
    name: "Main Branch",
    pharmacy_name: "City Pharmacy",
    location: {
      address: "123 Main St",
      latitude: 40.7128,
      longitude: -74.0060
    }
  },
  medicines: [
    {
      id: "medicine_id",
      name: "Medicine Name",
      brand_name: "Brand",
      category: "Antibiotics",
      quantity: 50,
      selling_price: 15.99,
      in_stock: true,
      is_promoted: false
    }
  ]
}
```

## Promotions & Featured Products

### 7. Get Promotions
**Endpoint:** `GET /api/mobile/promotions`
**Description:** Get active promotions and featured products
**Auth:** Optional (JWT)
**Query Parameters:**
- `lat` (number): User latitude for location filtering
- `lng` (number): User longitude for location filtering
- `category` (string): Filter by medicine category

**Response:**
```javascript
{
  promotions: [
    {
      id: "promotion_id",
      medicine: {
        id: "medicine_id",
        name: "Medicine Name",
        brand_name: "Brand",
        category: "Antibiotics",
        image_url: "https://..."
      },
      pharmacy: {
        id: "pharmacy_id",
        name: "City Pharmacy"
      },
      branch: {
        id: "branch_id",
        name: "Main Branch",
        location: {
          address: "123 Main St",
          distance_km: 2.5
        }
      },
      discount_percentage: 10,
      original_price: 15.99,
      promotional_price: 14.39,
      description: "Special weekend offer!",
      valid_from: "2024-12-01",
      valid_until: "2024-12-31",
      is_featured: true,
      created_at: "2024-12-01T10:00:00Z"
    }
  ]
}
```

### 8. Get Nearby Promotions
**Endpoint:** `GET /api/mobile/promotions/nearby`
**Description:** Get promotions near user location (for push notifications)
**Auth:** Required (JWT)
**Query Parameters:**
- `lat` (number): User latitude
- `lng` (number): User longitude
- `radius` (number): Search radius in kilometers (default: 5)

**Response:**
```javascript
{
  new_promotions: [
    {
      id: "promotion_id",
      title: "20% Off on Antibiotics",
      message: "Special offer at City Pharmacy - Main Branch (2.5 km away)",
      medicine_name: "Medicine Name",
      discount_percentage: 20,
      branch_name: "Main Branch",
      pharmacy_name: "City Pharmacy",
      distance_km: 2.5,
      expires_in_days: 5
    }
  ]
}
```

## Pharmacy Owner Endpoints (Authenticated)

### 9. Create Promotion
**Endpoint:** `POST /api/promotions`
**Description:** Create a new promotion for a medicine
**Auth:** Required (JWT, owner only)
**Request Body:**
```javascript
{
  branch_id: "branch_id",
  medicine_id: "medicine_id",
  discount_percentage: 10,
  promotional_price: 14.39,
  description: "Special weekend offer!",
  valid_from: "2024-12-01",
  valid_until: "2024-12-31",
  is_featured: true,
  notification_enabled: true
}
```

### 10. Update Promotion
**Endpoint:** `PUT /api/promotions/:id`
**Description:** Update an existing promotion
**Auth:** Required (JWT, owner only)

### 11. Delete Promotion
**Endpoint:** `DELETE /api/promotions/:id`
**Description:** Delete a promotion
**Auth:** Required (JWT, owner only)

### 12. Get My Promotions
**Endpoint:** `GET /api/promotions/my-promotions`
**Description:** Get all promotions created by the owner
**Auth:** Required (JWT, owner only)

## Database Schema Requirements

### New Tables Needed

**1. mobile_users Table:**
```javascript
{
  id: ObjectId,
  full_name: String,
  email: String (unique),
  password_hash: String,
  phone: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  push_token: String, // For push notifications
  preferences: {
    notification_radius: Number, // km
    favorite_categories: [String]
  },
  created_at: Date,
  updated_at: Date
}
```

**2. promotions Table:**
```javascript
{
  id: ObjectId,
  pharmacy_id: ObjectId,
  branch_id: ObjectId,
  medicine_id: ObjectId,
  discount_percentage: Number,
  promotional_price: Number,
  description: String,
  valid_from: Date,
  valid_until: Date,
  is_featured: Boolean,
  is_active: Boolean,
  notification_sent: Boolean,
  created_by: ObjectId, // owner profile id
  created_at: Date,
  updated_at: Date
}
```

**3. branches Table Updates:**
Add location fields:
```javascript
{
  // ... existing fields
  latitude: Number,
  longitude: Number,
  operating_hours: String,
  // ... existing fields
}
```

**4. user_notifications Table:**
```javascript
{
  id: ObjectId,
  user_id: ObjectId, // mobile user
  promotion_id: ObjectId,
  title: String,
  message: String,
  read: Boolean,
  sent_at: Date,
  created_at: Date
}
```

## Implementation Notes

### Location-Based Search
Use MongoDB's geospatial queries:
```javascript
db.branches.createIndex({ location: "2dsphere" })

// Query
db.branches.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      $maxDistance: radius_in_meters
    }
  }
})
```

### Push Notification Integration
- Use Firebase Cloud Messaging (FCM) for push notifications
- When a promotion is created with `notification_enabled: true`, send push notifications to users within the specified radius
- Store push tokens in `mobile_users` table

### Security Considerations
1. Rate limiting for public search endpoints
2. JWT authentication for personalized features
3. Owner can only create promotions for their own pharmacy
4. Validate location coordinates
5. Sanitize search queries to prevent injection attacks

### Caching Strategy
- Cache popular medicine searches (Redis)
- Cache pharmacy locations
- Invalidate cache when stock levels change
- Cache promotion data with TTL

## Testing Checklist

- [ ] Medicine search returns accurate results
- [ ] Location-based sorting works correctly
- [ ] Promotions are filtered by validity dates
- [ ] Users receive notifications for nearby promotions
- [ ] Owners can only manage their own promotions
- [ ] Search handles special characters and SQL injection attempts
- [ ] Distance calculations are accurate
- [ ] Expired promotions are hidden from search results
