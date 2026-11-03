import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout.jsx'
import Home from '../pages/Home/index.jsx'
import Products from '../pages/Products/index.jsx'
import ProductDetails from '../pages/ProductDetails/index.jsx'
import Cart from '../pages/Cart/index.jsx'
import Checkout from '../pages/Checkout/index.jsx'
import Auth from '../pages/Auth/index.jsx'
import Account from '../pages/Account/index.jsx'
import Orders from '../pages/Orders/index.jsx'
import Contact from '../pages/Contact/index.jsx'
import Admin from '../pages/Admin/index.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/account" element={<Account />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}

