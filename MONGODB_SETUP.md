# MongoDB Backend Setup Guide

## Overview

This project now uses MongoDB as the backend database instead of Supabase. The backend is a Node.js Express server with MongoDB for data persistence.

## ⚠️ Important Notice

The frontend components in this project still contain Supabase references that need to be updated to use the MongoDB backend API. The migration has been started but requires additional work to complete.

## Backend Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Migration Status

Most frontend Supabase code references have been migrated to use the MongoDB backend API (`src/services/backendApi`).
If you still see `supabase` imports at runtime, please run `npm install` to refresh `package-lock.json` and rebuild the project. The only remaining mentions of Supabase are in documentation and the package lockfile.
**Option A: Local Installation**
- Download and install MongoDB from https://www.mongodb.com/try/download/community
- Start MongoDB service:
  ```bash
  # On Linux
  sudo systemctl start mongod
  
  # On Windows

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at https://www.mongodb.com/cloud/atlas
- Create a new cluster
- Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### Step 2: Backend Configuration

1. Navigate to backend directory:
```bash
cd backend
```
npm install
```

3. Configure environment variables:
- The `backend/.env` file has already been created with defaults
- Update `MONGODB_URI` if using MongoDB Atlas
- Change `JWT_SECRET` to a secure random string for production

```env
MONGODB_URI=mongodb://localhost:27017/gebeta-pharmacy
# or for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gebeta-pharmacy

JWT_SECRET=your-secure-secret-key-here

4. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:5000`

## Frontend Setup

1. Install frontend dependencies (from project root):
```bash
npm install
```

2. The environment is already configured in `.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
```

3. Start the frontend:
```bash
npm run dev
```

## API Endpoints

All API endpoints are available at `http://localhost:5000/api/`

### Authentication
- `POST /api/auth/signup` - Register (creates owner + pharmacy)
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get current session

### Resources
- `/api/profiles` - User profiles
- `/api/pharmacies` - Pharmacy details  
- `/api/branches` - Branch management
- `/api/medicines` - Medicine catalog
- `/api/alerts` - System alerts
- `/api/pharmacist-assignments` - Pharmacist-branch assignments
- `src/components/owner/AnalyticsDashboard.tsx`
- `src/components/owner/BranchManagement.tsx`
- `src/components/owner/BranchStockView.tsx`
If you find any remaining `supabase` imports, update them to use `src/services/backendApi` following the migration pattern in this document. After updating code, run:
- `src/components/owner/MedicineManagement.tsx`
```powershell
npm install
npm run dev
```

This will ensure `package-lock.json` is updated and the project runs without Supabase dependencies.
- `src/components/owner/PharmacistManagement.tsx`
- `src/components/owner/ReportsManagement.tsx`
- `src/components/owner/StockTransferManagement.tsx`
- `src/components/owner/TransactionHistory.tsx`

**Pharmacist Components:**
- `src/components/pharmacist/BranchStockView.tsx`
- `src/components/pharmacist/MyTransactions.tsx`
- `src/components/pharmacist/POSSystem.tsx`
- `src/components/pharmacist/StockRequestForm.tsx`

**Pages:**
- `src/pages/PharmacySetup.tsx`

### Migration Pattern

Each component should be updated following this pattern:

**Before:**
```typescript
import { supabase } from "@/integrations/supabase/client";

const fetchData = async () => {
  const { data, error } = await supabase
    .from("branches")
    .select("*");
  
  if (error) throw error;
  return data;
};
```

**After:**
```typescript
import { branchesApi } from "@/services/backendApi";

const fetchData = async () => {
  return await branchesApi.getAll();
};
```

## Testing the Setup
3. Start the frontend (`npm run dev`)
4. Navigate to `http://localhost:5173`

## Troubleshooting

### Backend Issues
- Check connection string in `.env`
- For Atlas, check network access and database user permissions
- Change the `PORT` in `backend/.env`
- Update `VITE_API_URL` in `.env.local` accordingly

### Frontend Issues

**API Errors:**
- Verify backend is running on port 5000
- Check browser console for CORS errors
- Verify `VITE_API_URL` is correct

**Build Errors:**
- Components with Supabase imports will cause TypeScript errors
- These need to be updated as described above

## Production Deployment

### Backend
### Frontend
1. Update `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy `dist` folder to Vercel, Netlify, or similar

## Security Considerations

- Never commit `.env` files with real credentials
- Use strong JWT secrets in production
- Enable MongoDB authentication in production
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Regular database backups

## Next Steps

1. Complete the component migration from Supabase to MongoDB backend API
2. Test all functionality (CRUD operations for all entities)
3. Implement error handling and loading states
4. Add validation to all forms
5. Test the complete user flows (owner and pharmacist)
6. Prepare for production deployment
