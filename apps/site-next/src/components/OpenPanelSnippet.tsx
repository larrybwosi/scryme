import React from 'react'
import { env, normalizeOpenPanelUrl } from '@repo/env'

export function OpenPanelSnippet() {
  const clientId =
    env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID ||
    env.VITE_OPENPANEL_CLIENT_ID ||
    undefined
  const host =
    env.NEXT_PUBLIC_OPENPANEL_HOST ||
    env.VITE_OPENPANEL_HOST ||
    undefined

  if (!clientId || clientId.includes('PLACEHOLDER') || clientId === 'your-openpanel-client-id') {
    return null
  }

  const apiUrl = normalizeOpenPanelUrl(host) || 'https://api.openpanel.dev/api'

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
