import React from 'react';
import Link from 'next/link';

export default function MarketingHomePage() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <header style={{ marginBottom: '4rem' }}>
        <div style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          backgroundColor: '#27272a',
          fontSize: '0.875rem',
          fontWeight: 500,
          marginBottom: '1.5rem',
          color: '#a1a1aa'
        }}>
          Multi-Tenant Product Marketing Platform
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '1rem', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Scryme Product Marketing CMS
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#a1a1aa', maxWidth: '700px', margin: '0 auto 2rem' }}>
          Empower organizations to manage product showcases, campaigns, promotional banners, landing pages, and media assets with RustFS S3 bucket isolation.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/admin" style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Open Admin Portal
          </Link>
          <a href="/api/products" style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: '#27272a',
            color: '#f4f4f5',
            textDecoration: 'none',
            fontWeight: 600,
            border: '1px solid #3f3f46'
          }}>
            Explore Marketing API
          </a>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
        <div style={{ padding: '1.5rem', borderRadius: '0.75rem', backgroundColor: '#18181b', border: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#60a5fa' }}>Product Showcases</h3>
          <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>Manage product features, specification matrices, gallery assets, and pricing callouts with versioning and draft states.</p>
        </div>
        <div style={{ padding: '1.5rem', borderRadius: '0.75rem', backgroundColor: '#18181b', border: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#34d399' }}>RustFS S3 Bucket Isolation</h3>
          <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>Media uploads dynamically target organization-isolated buckets (<code>dealio-org-{'{orgId}'}</code>) on self-hosted RustFS S3 storage.</p>
        </div>
        <div style={{ padding: '1.5rem', borderRadius: '0.75rem', backgroundColor: '#18181b', border: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f472b6' }}>Full Multi-Tenancy</h3>
          <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>Session-based tenant isolation and row-level access control guarantee document isolation across organizations.</p>
        </div>
      </section>
    </main>
  );
}
