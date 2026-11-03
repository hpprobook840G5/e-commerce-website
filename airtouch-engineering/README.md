# AirTouch Engineering

A full-stack e-commerce project scaffold for AirTouch Engineering.

## Stack

- **Frontend**: React.js with Vite, JavaScript (ES6+), React Router DOM, Tailwind CSS v4 (via `@tailwindcss/vite`), Lucide React for icons, Framer Motion for transitions, Zustand for global state management (cart), Three.js with React Three Fiber and Drei for 3D graphics, GSAP with ScrollTrigger for scroll-controlled animations, Lenis for smooth scrolling.
- **Backend**: Node.js with Express.js using MVC architecture, REST APIs, express-validator, Helmet, CORS, express-rate-limit, dotenv, Supabase Auth JWT verification placeholder.
- **Database, Auth & Storage**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage, Row Level Security). Supabase JavaScript SDK on backend.
- **Integrations**: UPI QR payment (display placeholder), WhatsApp Click-to-Chat, Google Maps embed, Resend (optional placeholder).

## Folder Structure

```
airtouch-engineering/
├── frontend/
│   ├── public/
│   │   └── upi-qr.png
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home/index.jsx
│   │   │   ├── Products/index.jsx
│   │   │   ├── ProductDetails/index.jsx
│   │   │   ├── Cart/index.jsx
│   │   │   ├── Checkout/index.jsx
│   │   │   ├── Auth/index.jsx
│   │   │   ├── Account/index.jsx
│   │   │   ├── Orders/index.jsx
│   │   │   ├── Contact/index.jsx
│   │   │   └── Admin/index.jsx
│   │   ├── components/
│   │   │   ├── navbar/Navbar.jsx
│   │   │   ├── products/ProductCard.jsx
│   │   │   ├── cart/CartItem.jsx
│   │   │   ├── payments/UpiQrCode.jsx
│   │   │   ├── animations/
│   │   │   │   ├── SmoothScroll.jsx
│   │   │   │   └── HeroScene.jsx
│   │   │   └── common/
│   │   │       ├── WhatsAppButton.jsx
│   │   │       ├── MapEmbed.jsx
│   │   │       └── Footer.jsx
│   │   ├── layouts/MainLayout.jsx
│   │   ├── hooks/useScrollAnimation.js
│   │   ├── store/cartStore.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── supabase.js
│   │   ├── routes/AppRoutes.jsx
│   │   ├── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── products.routes.js
│   │   │   ├── categories.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── orders.routes.js
│   │   │   ├── payments.routes.js
│   │   │   ├── users.routes.js
│   │   │   └── admin.routes.js
│   │   ├── controllers/.gitkeep
│   │   ├── services/.gitkeep
│   │   ├── models/.gitkeep
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── authenticate.js
│   │   ├── validators/.gitkeep
│   │   ├── config/
│   │   │   ├── supabase.js
│   │   │   └── env.js
│   │   ├── utils/.gitkeep
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── supabase/
│   └── migrations/.gitkeep
├── .gitignore
└── README.md
```

## Setup & Running

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Notes

- **Database Migrations**: The `supabase/migrations/` directory holds SQL migration files for Supabase database schema, tables, and policies.
- **UPI QR Code**: The UPI QR code is currently a static placeholder image located at `frontend/public/upi-qr.png`. Replace this image file with the actual business UPI QR code before production.

