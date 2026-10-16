import { createFileRoute } from '@tanstack/react-router'
import { HelpCircle } from 'lucide-react'

export const Route = createFileRoute('/docs/faq')({
  component: FaqPage
})

function FaqPage() {
  const faqs = [
    {
      question: 'Is Scryme designed for multi-location businesses?',
      answer: 'Yes. The platform is built around organization-level tenancy and location-aware inventory so stores, warehouses, and service branches can operate independently while sharing a central backend.'
    },
    {
      question: 'Do I need separate credentials for public and internal APIs?',
      answer: 'Usually yes. Public storefront flows should use the least-privileged client context, while staff and admin tooling should use higher-trust server-side credentials.'
    },
    {
      question: 'How do I troubleshoot stock discrepancies?',
      answer: 'Review stock movements, reconciliation events, and the specific location context first. Scryme expects stock calculations to be validated against movement history and physical count workflows.'
    },
    {
      question: 'Can the platform integrate with custom payment or messaging tools?',
      answer: 'Yes. Payment, messaging, and CRM integrations are designed to plug into event streams, webhooks, and secure API exchange patterns.'
    }
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">FAQ</h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Common questions from developers implementing secure, multi-tenant retail and operations workflows with Scryme.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.question} className="bg-white p-5 rounded-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-2">{faq.question}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
