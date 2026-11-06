# AirTouch Engineering - Backend API

Express.js REST API with MVC structure, Rate Limiting, Helmet security headers, Supabase integrations, and separate Admin Authentication.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173,http://localhost:5175,http://127.0.0.1:5175
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-customer-jwt-secret

# Admin Authentication (Never expose to frontend VITE_ variables)
ADMIN_EMAIL=admin@airtouchengineering.in
ADMIN_PASSWORD_HASH="<bcrypt_hash_generated_below>"
ADMIN_JWT_SECRET=your-secure-admin-jwt-secret
ADMIN_SESSION_HOURS=8
```

## Admin Password Hashing Script

To generate a secure bcrypt hash for `ADMIN_PASSWORD_HASH`:

```bash
node scripts/hash-admin-password.js "YourSecurePasswordHere"
```

Example output:
```
--- AirTouch Engineering Admin Password Hash Generator ---
Plaintext password: YourSecurePasswordHere
Bcrypt hash (ADMIN_PASSWORD_HASH):
$2b$12$...

Add this to your backend/.env as:
ADMIN_PASSWORD_HASH="$2b$12$..."
```

## Admin API Endpoints

- `POST /api/admin/login`: Rate-limited to 5 attempts per 15 min per IP. Sets httpOnly `admin_token` cookie on success.
- `POST /api/admin/logout`: Clears the httpOnly `admin_token` cookie.
- `GET /api/admin/me`: Returns admin profile if `admin_token` cookie is valid.

