import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import AtRisk from './pages/AtRisk'
import Contacts from './pages/Contacts'

export default function App() {
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`).catch(() => {})
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="at-risk" element={<AtRisk />} />
          <Route path="contacts" element={<Contacts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}