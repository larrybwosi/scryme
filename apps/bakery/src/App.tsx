import { Routes, Route, Navigate } from 'react-router'
import OverviewPage from './pages/OverviewPage'
import BatchesPage from './pages/BatchesPage'
import RecipesPage from './pages/RecipesPage'
import TemplatesPage from './pages/TemplatesPage'
import BakersPage from './pages/BakersPage'
import DeliveriesPage from './pages/DeliveriesPage'
import CategoriesPage from './pages/CategoriesPage'
import SettingsPage from './pages/SettingsPage'
import SetupPage from './pages/SetupPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import BakeryAuthGuard from './components/bakery/BakeryAuthGuard'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup" element={<SetupPage />} />

      {/* Protected Dashboard Routes */}
      <Route
        element={
          <BakeryAuthGuard>
            <DashboardLayout />
          </BakeryAuthGuard>
        }
      >
        <Route path="/" element={<OverviewPage />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/batches" element={<BatchesPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/bakers" element={<BakersPage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
