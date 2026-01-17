import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CardsPage from './pages/CardsPage'
import CrmPage from './pages/CrmPage'
import DigitalPage from './pages/DigitalPage'
import PaymentsPage from './pages/PaymentsPage'
import MiddlewarePage from './pages/MiddlewarePage'

function App() {
  return (
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
      {/* Backdrop gradient */}
      <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-gradient-to-tl from-[#283054] via-[#283054]/20 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/digital" element={<DigitalPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/middleware" element={<MiddlewarePage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
