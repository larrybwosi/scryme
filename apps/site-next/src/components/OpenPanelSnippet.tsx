import React from 'react'

export function OpenPanelSnippet() {
  const clientId =
    (typeof process !== 'undefined' &&
      (process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID ||
        process.env.VITE_OPENPANEL_CLIENT_ID)) ||
    undefined
  const host =
    (typeof process !== 'undefined' &&
      (process.env.NEXT_PUBLIC_OPENPANEL_HOST ||
        process.env.VITE_OPENPANEL_HOST)) ||
    undefined

  if (!clientId || clientId.includes('PLACEHOLDER') || clientId === 'your-openpanel-client-id') {
    return null
  }

  // Normalize host URL to point to /api endpoint
  let apiUrl = host ? host.trim() : 'https://api.openpanel.dev'
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = `https://${apiUrl}`
  }
  apiUrl = apiUrl.replace(/\/+$/, '')
  if (!apiUrl.endsWith('/api')) {
    apiUrl = `${apiUrl}/api`
  }

  const jsCode = `
    window.op = window.op || function () { (window.op.q = window.op.q || []).push(arguments) };
    window.op('init', {
      clientId: '${clientId}',
      apiUrl: '${apiUrl}',
      trackScreenViews: true,
      trackAttributes: true,
      trackOutgoingLinks: true,
    });
  `

  return (
    <>
      <script src="https://openpanel.dev/op1.js" defer async />
      <script dangerouslySetInnerHTML={{ __html: jsCode }} />
    </>
  )
}
