import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { OrganizationProvider } from '@/lib/providers/organization-context'
import { DeleteConfirmationProvider } from '@/lib/providers/delete-modal'
import { AuthProvider } from '@/lib/providers/auth-context'
import { DashboardLayout } from './layouts/DashboardLayout'
import OverviewPage from './pages/OverviewPage'
import RecipesPage from './pages/RecipesPage'
import TemplatesPage from './pages/TemplatesPage'
import BatchesPage from './pages/BatchesPage'
import IngredientsPage from './pages/IngredientsPage'
import CategoriesPage from './pages/CategoriesPage'
import BakersPage from './pages/BakersPage'
import SettingsPage from './pages/SettingsPage'
import DeliveriesPage from './pages/DeliveriesPage'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import { BakeryAuthGuard } from '@/components/bakery/BakeryAuthGuard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <AuthProvider>
          <DeleteConfirmationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route element={<BakeryAuthGuard><DashboardLayout /></BakeryAuthGuard>}>
                  <Route path="/" element={<OverviewPage />} />
                  <Route path="/recipes" element={<RecipesPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/batches" element={<BatchesPage />} />
                  <Route path="/ingredients" element={<IngredientsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/bakers" element={<BakersPage />} />
                  <Route path="/deliveries" element={<DeliveriesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </DeleteConfirmationProvider>
        </AuthProvider>
      </OrganizationProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}

export default App
