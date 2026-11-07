# AirTouch Engineering - Backend API

Express.js REST API with MVC structure, Rate Limiting, Helmet security headers, Supabase integrations, and separate Admin Authentication.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Admin Authentication (Never expose to frontend VITE_ variables)
ADMIN_EMAIL=admin@airtouch.test
ADMIN_PASSWORD_HASH='<bcrypt_hash_generated_below>'
ADMIN_JWT_SECRET=your-secure-admin-jwt-secret-min-32-chars
ADMIN_SESSION_HOURS=8
```

## Admin Password Hashing Script

To generate a secure bcrypt hash (cost 12) for `ADMIN_PASSWORD_HASH`:

```bash
node scripts/hash-admin-password.js "YourSecurePasswordHere"
```

Example output:
```
--- AirTouch Engineering Admin Password Hash Generator ---
ADMIN_PASSWORD_HASH='$2b$12$...'
```

Copy the generated hash and paste it into `backend/.env` wrapped in single quotes:
```env
ADMIN_PASSWORD_HASH='$2b$12$...'
```

## Admin API Endpoints

- `POST /api/admin/login`: Rate-limited to 5 attempts per 15 min per IP. Sets httpOnly `admin_token` cookie on success.
- `POST /api/admin/logout`: Clears the httpOnly `admin_token` cookie.
- `GET /api/admin/me`: Returns admin profile if `admin_token` cookie is valid.
- `GET /api/admin/products`: Paginated product management list (includes hidden products).
- `POST /api/admin/products`: Create a new product.
- `PATCH /api/admin/products/:id`: Update existing product.
- `DELETE /api/admin/products/:id`: Soft-delete product (`is_active = false`).
- `POST /api/admin/products/:id/image`: Upload product image to Supabase Storage.
- `GET /api/admin/analytics/summary`: High-level store metrics.
- `GET /api/admin/analytics/products`: Product-wise sales breakdown.
- `GET /api/admin/analytics/categories`: Category-wise sales breakdown.
- `GET /api/admin/analytics/trend`: Time-series revenue trend.
- `GET /api/admin/contact-messages`: View and manage customer inquiries.
