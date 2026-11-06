import { Outlet } from 'react-router-dom'
import AnnouncementBar from '../components/common/AnnouncementBar.jsx'
import Navbar from '../components/navbar/Navbar.jsx'
import Footer from '../components/common/Footer.jsx'
import WhatsAppButton from '../components/common/WhatsAppButton.jsx'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

