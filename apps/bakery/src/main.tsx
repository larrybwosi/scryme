import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { QueryProvider } from '@/lib/tanstack-axios'
import { AuthProvider } from '@/lib/providers/auth-context'
import { OrganizationProvider } from '@/lib/providers/organization-context'
import { DeleteConfirmationProvider } from '@/lib/providers/delete-modal'
import { UpdaterProvider } from '@/lib/providers/UpdateProvider'
import { TooltipProvider } from '@repo/ui/components/ui/tooltip'
import { Toaster } from 'sonner'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <OrganizationProvider>
          <DeleteConfirmationProvider>
            <UpdaterProvider>
              <TooltipProvider>
                <BrowserRouter>
                  <App />
                  <Toaster />
                </BrowserRouter>
              </TooltipProvider>
            </UpdaterProvider>
          </DeleteConfirmationProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>,
)
