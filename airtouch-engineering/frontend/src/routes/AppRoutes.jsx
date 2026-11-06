import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import AdminRoute from './AdminRoute.jsx'
import Home from '../pages/Home/index.jsx'
import Products from '../pages/Products/index.jsx'
import ProductDetails from '../pages/ProductDetails/index.jsx'
import Cart from '../pages/Cart/index.jsx'
import Checkout from '../pages/Checkout/index.jsx'
import Auth from '../pages/Auth/index.jsx'
import AuthCallback from '../pages/Auth/AuthCallback.jsx'
import Account from '../pages/Account/index.jsx'
import Orders from '../pages/Orders/index.jsx'
import Contact from '../pages/Contact/index.jsx'
import Admin from '../pages/Admin/index.jsx'
import AdminLogin from '../pages/AdminLogin/index.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Customer Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/account" element={<Account />} />
          <Route path="/orders" element={<Orders />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
    </Routes>
  )
}
