import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes.jsx'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'
import { CustomerAuthProvider } from './context/CustomerAuthContext.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <CustomerAuthProvider>
          <AppRoutes />
        </CustomerAuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  )
}
