'use client';

import React from 'react';
import { SupplierDetailView } from '@repo/suppliers';
import { useParams } from 'next/navigation';

export default function SupplierDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <SupplierDetailView supplierId={id} />;
}
