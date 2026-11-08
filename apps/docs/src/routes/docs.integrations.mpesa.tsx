import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Wallet,
  Key,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  AlertTriangle,
  ArrowRight,
  Settings,
  Sparkles,
  Smartphone,
  Server,
  Zap,
  HelpCircle,
  Lock,
} from 'lucide-react'
import { useState } from 'react'
import { createDocSeo } from '../lib/seo'

export const Route = createFileRoute('/docs/integrations/mpesa')({
  head: () =>
    createDocSeo({
      title: 'M-Pesa Payment Integration & Credentials Guide',
      description:
        'Complete guide on enabling Safaricom M-Pesa payments in Scryme: acquiring Daraja API credentials, Sandbox vs Production setup, Paybill vs Till numbers, and automatic customer reconciliation.',
      pathname: '/docs/integrations/mpesa',
      keywords: [
        'M-Pesa Integration',
        'Safaricom Daraja',
        'Lipa Na M-Pesa',
        'STK Push',
        'M-Pesa Credentials',
        'Consumer Key',
        'Consumer Secret',
        'Pass Key',
        'Paybill',
        'Till Number',
        'Scryme Payments',
      ],
    }),
  component: MpesaDocumentationPage,
})

export function MpesaDocumentationPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const errorCodes = [
    {
      code: '1032',
      name: 'Request Cancelled by User',
      description: 'The customer saw the STK prompt on their phone and pressed Cancel or dismissed the SIM dialog.',
      solution: 'Prompt the customer to re-attempt payment, or offer manual Paybill/Till entry.',
    },
    {
      code: '1',
      name: 'Insufficient Funds',
      description: 'The customer’s M-Pesa wallet does not have sufficient balance to cover the bill amount and carrier transaction fees.',
      solution: 'Advise customer to top up their M-Pesa balance or split the bill with an alternative payment method.',
    },
    {
      code: '2001',
      name: 'Invalid Initiator Password / PIN',
      description: 'Initiator credentials specified in Scryme settings do not match Safaricom Daraja records for disbursement operations.',
      solution: 'Verify and reset your Operator/Initiator password in the Safaricom M-Pesa Business portal.',
    },
    {
      code: '1037',
      name: 'User Timeout / SIM Unreachable',
      description: 'Safaricom was unable to deliver the SIM push notification because the customer’s phone was off, out of network coverage, or delayed.',
      solution: 'Ensure the customer has cellular signal. Scryme will automatically poll or allow manual retry.',
    },
    {
      code: '0',
      name: 'Success',
      description: 'The transaction completed successfully. Safaricom returned an official M-Pesa receipt code (e.g., QGH48X192K).',
      solution: 'Payment is marked COMPLETED, receipt printed/emailed, and customer linked automatically.',
    },
  ]

  return (
    <div className="space-y-12 max-w-4xl pb-16">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Wallet className="w-3.5 h-3.5" /> M-Pesa Payments & Daraja Guide
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Safaricom M-Pesa Integration
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Scryme natively connects your physical POS terminals, online checkout counters, and billing invoices to{' '}
          <strong>Safaricom M-Pesa</strong>. This guide walks you through acquiring Daraja API credentials, understanding
          Paybill versus Buy Goods (Till) configurations, configuring your Scryme workspace, and managing real-time payment reconciliation.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Instant STK Push</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Prompt customer phones directly with the exact bill amount. Payer merely enters their M-Pesa PIN.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Auto Customer Saving</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automatically parses payer phone number and name into your CRM, building customer order history seamlessly.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Encrypted Credentials</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            All API consumer secrets and passkeys are encrypted at rest with hardware-backed KMS before storage.
          </p>
        </div>
      </div>

      {/* Section 1: Paybill vs Till */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <h2>Step 1: Understand Paybill vs. Buy Goods (Till)</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Before configuring credentials, select the M-Pesa shortcode model that matches your Safaricom business contract:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              PAYBILL NUMBER
            </div>
            <h4 className="font-bold text-sm text-slate-900">Paybill (5-7 digits)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customers input your Business Number and an <strong>Account Number</strong> (e.g., Order #, Invoice #, or Customer ID).
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Supports STK Push and C2B customer payments</li>
              <li>Allows custom Account Reference for invoice matching</li>
              <li>Payer fees can be shared or borne by merchant/customer</li>
              <li>Ideal for e-commerce, services, subscriptions, and POS</li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              BUY GOODS / TILL
            </div>
            <h4 className="font-bold text-sm text-slate-900">Buy Goods Till (5-7 digits)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customers choose "Buy Goods and Services" and enter your Till Number directly without typing an account number.
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Free for customers to pay (standard merchant fee applies)</li>
              <li>Supports Lipa Na M-Pesa Online STK Push via Head Office shortcode</li>
              <li>Commonly deployed in retail stores, restaurants, and supermarkets</li>
              <li>Settles to nominated merchant bank account or store till</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: Obtaining Daraja Credentials */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <Key className="w-5 h-5 text-emerald-600" />
          <h2>Step 2: Obtain Credentials from Safaricom Daraja Portal</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Safaricom requires API keys through their developer portal (<strong>Daraja</strong>) to authorize transactions between Scryme and your M-Pesa till/paybill.
        </p>

        {/* Tab-like overview */}
        <div className="space-y-4">
          {/* Sandbox Walkthrough */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">A</span>
                <h3 className="font-bold text-sm text-slate-900">Testing with Daraja Sandbox (Recommended First)</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                Development & Testing
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed">
              <ol className="space-y-3 list-decimal list-inside">
                <li>
                  <strong className="text-slate-800">Create a Daraja Developer Account:</strong> Visit{' '}
                  <a
                    href="https://developer.safaricom.co.ke"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 underline inline-flex items-center gap-1 font-medium"
                  >
                    developer.safaricom.co.ke <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  and click <strong>Sign Up</strong>.
                </li>
                <li>
                  <strong className="text-slate-800">Create a New App:</strong> Navigate to the <strong>My Apps</strong> menu and click <strong>Add a New App</strong>.
                </li>
                <li>
                  <strong className="text-slate-800">Select API Products:</strong> Check <strong>Lipa Na M-Pesa Sandbox</strong> and <strong>Customer to Business (C2B)</strong>, then submit.
                </li>
                <li>
                  <strong className="text-slate-800">Copy Keys:</strong> Once generated, click on your app to reveal your{' '}
                  <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-semibold">Consumer Key</code> and{' '}
                  <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-semibold">Consumer Secret</code>.
                </li>
              </ol>

              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Daraja Standard Test Sandbox Credentials:</span>
                  <button
                    onClick={() => copyToClipboard('174379', 'sandbox-sc')}
                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" /> {copiedKey === 'sandbox-sc' ? 'Copied' : 'Copy ShortCode'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-slate-600">
                  <div><strong>Test ShortCode:</strong> 174379</div>
                  <div><strong>Test Type:</strong> Paybill</div>
                  <div className="sm:col-span-2 break-all">
                    <strong>Test PassKey:</strong> bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Production Go-Live Walkthrough */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">B</span>
                <h3 className="font-bold text-sm text-slate-900">Production Go-Live (Live Merchant Payments)</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Live Store Settlement
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                To collect real payments from customer M-Pesa wallets into your business till or bank account, complete Safaricom's Go-Live process:
              </p>

              <ol className="space-y-3 list-decimal list-inside">
                <li>
                  <strong className="text-slate-800">Prepare Verification Documents:</strong> Have your Business Registration Certificate / Certificate of Incorporation, Director National ID/Passport, and an official M-Pesa Business Nominated Phone Number.
                </li>
                <li>
                  <strong className="text-slate-800">Apply for Go-Live on Daraja:</strong> In your Daraja account, click <strong>Go Live</strong> in the top navigation.
                </li>
                <li>
                  <strong className="text-slate-800">Select Organization Type:</strong> Choose <em>Shortcode</em> (Paybill or Buy Goods Till), enter your commercial shortcode, and attach required KYC documents.
                </li>
                <li>
                  <strong className="text-slate-800">Verification OTP:</strong> Safaricom will send an SMS verification token to the Nominated Administrator phone number registered on the business shortcode.
                </li>
                <li>
                  <strong className="text-slate-800">Generate Production App:</strong> After approval, Daraja will display your <strong>Production Consumer Key</strong> and <strong>Production Consumer Secret</strong>.
                </li>
                <li>
                  <strong className="text-slate-800">Obtain the Online Passkey:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-600">
                    <li>For Paybill: Safaricom emails the live PassKey to your administrator email address, or displays it under Lipa Na M-Pesa Online within the production app.</li>
                    <li>For Till (Buy Goods): The PassKey is generated against your Store or Head Office shortcode.</li>
                  </ul>
                </li>
              </ol>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p>
                  <strong>Security Reminder:</strong> Never share your Consumer Secret, Passkey, or Initiator Password via unencrypted chat or email. Scryme uses AES-256 GCM encryption at rest to protect these credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Scryme Web App Configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <Settings className="w-5 h-5 text-emerald-600" />
          <h2>Step 3: Configure Credentials in Scryme</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Once you have your credentials, link them to your Scryme workspace to enable POS checkout, invoicing, and webhooks:
        </p>

        <div className="border border-slate-200 rounded-xl bg-white p-6 space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Navigation Path</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
            <span>Workspace</span>
            <span>&rarr;</span>
            <span className="text-indigo-600 font-semibold">Settings</span>
            <span>&rarr;</span>
            <span>Organization Settings</span>
            <span>&rarr;</span>
            <span className="text-emerald-700 font-semibold">Payment Options (M-Pesa)</span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Field Reference Table</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Field Name</th>
                    <th className="p-3">Value Type</th>
                    <th className="p-3">Requirement</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Environment</td>
                    <td className="p-3 font-mono">SANDBOX | PRODUCTION</td>
                    <td className="p-3 text-emerald-600 font-medium">Required</td>
                    <td className="p-3">Select Sandbox for testing or Production for real money settlement.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">M-Pesa Type</td>
                    <td className="p-3 font-mono">PAYBILL | TILL</td>
                    <td className="p-3 text-emerald-600 font-medium">Required</td>
                    <td className="p-3">Select whether your shortcode is a Paybill or a Buy Goods Till.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">ShortCode</td>
                    <td className="p-3 font-mono">5 - 7 digits</td>
                    <td className="p-3 text-emerald-600 font-medium">Required</td>
                    <td className="p-3">Your Safaricom Paybill or Till number (e.g. 174379, 600000).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Consumer Key</td>
                    <td className="p-3 font-mono">Alpha-numeric string</td>
                    <td className="p-3 text-emerald-600 font-medium">Required</td>
                    <td className="p-3">Generated in your Daraja App dashboard.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Consumer Secret</td>
                    <td className="p-3 font-mono">Alpha-numeric string</td>
                    <td className="p-3 text-emerald-600 font-medium">Required</td>
                    <td className="p-3">Generated alongside Consumer Key in your Daraja dashboard.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Pass Key</td>
                    <td className="p-3 font-mono">Hex-encoded hash</td>
                    <td className="p-3 text-emerald-600 font-medium">Required (STK Push)</td>
                    <td className="p-3">Lipa Na M-Pesa Online passkey required to trigger automated PIN prompts.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Initiator Password</td>
                    <td className="p-3 font-mono">Encrypted string</td>
                    <td className="p-3 text-slate-400">Optional</td>
                    <td className="p-3">Required if your organization performs automated B2C disbursements or refunds.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Click <strong>Save changes</strong>. Your settings immediately apply across all connected POS devices and online checkouts without requiring app restarts.
            </span>
          </div>
        </div>
      </section>

      {/* Section 4: Payment Lifecycle & Customer Tracking */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <Zap className="w-5 h-5 text-emerald-600" />
          <h2>Step 4: Payment Processing & Automated Tracking</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          How Scryme processes and reconciles customer payments in real time:
        </p>

        <div className="space-y-3">
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
              STK Push (Lipa Na M-Pesa Online)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a cashier rings up a sale or a customer checks out on web/invoicing:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Cashier selects <strong>M-Pesa</strong> and inputs customer phone (accepts <code>07...</code>, <code>254...</code>, or <code>+254...</code>).</li>
              <li>Scryme standardizes the phone to Kenyan E.164 format (<code>254XXXXXXXXX</code>).</li>
              <li>A real-time STK push appears on the customer's mobile device displaying your business name and amount.</li>
              <li>Customer enters PIN &rarr; Safaricom dispatches webhook callback &rarr; Scryme marks the sale as <strong>PAID</strong> within seconds.</li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">2</span>
              Manual C2B Paybill Payments & Unclaimed Reconciliations
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              For customers who pay through their SIM toolkit without a prompt:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Customer sends money to your Paybill using Order or Invoice number as Account Reference.</li>
              <li>Safaricom sends a C2B Confirmation webhook to Scryme.</li>
              <li>Scryme matches the transaction code or allows cashiers to search and claim the payment by receipt code.</li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">3</span>
              Autonomous Customer Directory Linking
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every successful M-Pesa payment automatically links or registers the payer in your workspace:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Existing customers with matching phone numbers have this new purchase recorded to their profile.</li>
              <li>New walk-in customers are automatically created with their name (from C2B records) or standardized phone number.</li>
              <li>CRM triggers (like welcome messages, loyalty points, or digital receipts) dispatch automatically.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 5: Troubleshooting & Result Codes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2>Troubleshooting & Daraja Error Codes</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Reference for common Safaricom response codes when processing M-Pesa transactions:
        </p>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="divide-y divide-slate-200">
            {errorCodes.map((err) => (
              <div key={err.code} className="p-4 space-y-1.5 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      ResultCode {err.code}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{err.name}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">{err.description}</p>
                <div className="text-[11px] text-emerald-700 bg-emerald-50/60 p-2 rounded border border-emerald-100">
                  <strong>Recommended Action:</strong> {err.solution}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps Card */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> Ready to accept payments
        </div>
        <h3 className="text-lg font-bold">Start ringing up sales on Scryme POS</h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          Now that your shortcode and credentials are saved, launch the POS app or web checkout. M-Pesa will appear as a primary payment method alongside cash and card.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            to="/api-reference/pos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors"
          >
            <span>Explore POS API Reference</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/docs/integrations"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
          >
            <span>Back to All Integrations</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
