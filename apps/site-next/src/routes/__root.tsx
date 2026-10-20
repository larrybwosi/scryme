import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { ThemeProvider } from '../components/ThemeProvider'
import { AnalyticsSnippet } from '../components/AnalyticsSnippet'
import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Scryme - Next-Gen ERP Platform' }
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Space+Grotesk:wght@400..700&display=swap' },
      { rel: 'stylesheet', href: appCss }
    ]
  }),
  component: RootComponent
})

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <AnalyticsSnippet />
      </head>
      <body className="min-h-screen font-sans antialiased selection:bg-[#d2ff3a] selection:text-[#090a0b] bg-[var(--bg-main)] text-[var(--text-main)]">
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
