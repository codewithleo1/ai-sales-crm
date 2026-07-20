/**
 * Root app component — sets up React Router with all pages.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import AtRisk from './pages/AtRisk'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="at-risk" element={<AtRisk />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}