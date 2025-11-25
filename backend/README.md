# Gebeta Pharmacy Backend - Node.js Express Template

This is a Node.js Express backend template that mirrors the API structure of the Gebeta Pharmacy Management System. It's designed to make migration from Supabase to a custom Node backend seamless.

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # PostgreSQL database connection
├── controllers/             # Business logic for each domain
│   ├── auth.controller.js
│   ├── pharmacy.controller.js
│   ├── branch.controller.js
│   ├── medicine.controller.js
│   ├── mainStock.controller.js
│   ├── branchStock.controller.js
│   ├── transaction.controller.js
│   ├── stockTransfer.controller.js
│   ├── alert.controller.js
│   ├── profile.controller.js
│   └── pharmacistAssignment.controller.js
├── middleware/
│   └── auth.js              # JWT authentication & authorization
├── routes/                  # API route definitions
│   ├── auth.routes.js
│   ├── pharmacy.routes.js
│   ├── branch.routes.js
│   ├── medicine.routes.js
│   ├── mainStock.routes.js
│   ├── branchStock.routes.js
│   ├── transaction.routes.js
│   ├── stockTransfer.routes.js
│   ├── alert.routes.js
│   ├── profile.routes.js
│   └── pharmacistAssignment.routes.js
├── .env.example             # Environment variables template
├── package.json
├── server.js                # Main Express server
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gebeta_pharmacy
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

4. Set up your PostgreSQL database with the same schema as your Supabase project

5. Start the server:
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/session` - Get current session

### Profiles
- `GET /api/profiles` - Get all profiles (owner only)
- `GET /api/profiles/:id` - Get profile by ID
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/:id` - Update profile

### Pharmacies
- `GET /api/pharmacies` - Get pharmacy
- `POST /api/pharmacies` - Create pharmacy (owner only)
- `PUT /api/pharmacies/:id` - Update pharmacy (owner only)

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID
- `POST /api/branches` - Create branch (owner only)
- `PUT /api/branches/:id` - Update branch (owner only)
- `DELETE /api/branches/:id` - Delete branch (owner only)

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Create medicine (owner only)
- `PUT /api/medicines/:id` - Update medicine (owner only)
- `DELETE /api/medicines/:id` - Delete medicine (owner only)

### Main Stock
- `GET /api/main-stock` - Get all main stock (owner only)
- `GET /api/main-stock/medicine/:medicineId` - Get stock by medicine
- `POST /api/main-stock` - Create stock (owner only)
- `PUT /api/main-stock/:id` - Update stock (owner only)
- `DELETE /api/main-stock/:id` - Delete stock (owner only)

### Branch Stock
- `GET /api/branch-stock` - Get all branch stock
- `GET /api/branch-stock/branch/:branchId` - Get stock by branch
- `POST /api/branch-stock` - Create branch stock
- `PUT /api/branch-stock/:id` - Update branch stock
- `DELETE /api/branch-stock/:id` - Delete branch stock

### Transactions
- `GET /api/transactions` - Get all transactions (owner only)
- `GET /api/transactions/pharmacist/:pharmacistId` - Get transactions by pharmacist
- `GET /api/transactions/:id/items` - Get transaction items
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/items` - Create transaction item

### Stock Transfers
- `GET /api/stock-transfers` - Get all transfers
- `GET /api/stock-transfers/pharmacist/:pharmacistId` - Get transfers by pharmacist
- `POST /api/stock-transfers` - Create transfer
- `PUT /api/stock-transfers/:id` - Update transfer (owner only)

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/branch/:branchId` - Get alerts by branch
- `PUT /api/alerts/:id` - Update alert
- `PUT /api/alerts/:id/read` - Mark alert as read
- `PUT /api/alerts/:id/resolve` - Mark alert as resolved

### Pharmacist Assignments
- `GET /api/pharmacist-assignments` - Get all assignments (owner only)
- `GET /api/pharmacist-assignments/pharmacist/:pharmacistId` - Get assignments by pharmacist
- `POST /api/pharmacist-assignments` - Create assignment (owner only)
- `DELETE /api/pharmacist-assignments/:id` - Delete assignment (owner only)

## 🔐 Authentication

This backend uses JWT (JSON Web Tokens) for authentication. 

### How it works:
1. User signs up or signs in
2. Server generates a JWT token
3. Client stores the token (usually in localStorage)
4. Client sends token in Authorization header: `Bearer <token>`
5. Server validates token on protected routes

### Role-based Access:
- `owner` - Full access to all resources
- `pharmacist` - Limited access based on branch assignments

## 🔄 Migrating from Supabase

To migrate from your current Supabase setup to this Node backend:

1. **Export your database schema** from Supabase
2. **Import the schema** into your PostgreSQL database
3. **Update the frontend API calls** in `src/services/api.ts`:
   - Change from Supabase client calls to HTTP requests
   - Update base URL to point to this backend
   - Add JWT token to Authorization headers

Example frontend migration:
```typescript
// Before (Supabase)
const { data, error } = await supabase
  .from('medicines')
  .select('*');

// After (Node backend)
const response = await fetch('http://localhost:5000/api/medicines', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

## 🛡️ Security Features

- Helmet.js for security headers
- CORS configuration
- JWT authentication
- Password hashing with bcrypt
- Input validation with express-validator
- Role-based authorization
- SQL injection protection via parameterized queries

## 📝 Development Notes

- All passwords are hashed using bcrypt before storage
- Database queries use parameterized statements to prevent SQL injection
- Error messages are sanitized in production mode
- Request logging with Morgan
- Environment variables for configuration

## 🧪 Testing

Health check endpoint:
```bash
curl http://localhost:5000/health
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Documentation](https://jwt.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🤝 Contributing

This is a template for migration. Customize it based on your specific needs.

## 📄 License

MIT
