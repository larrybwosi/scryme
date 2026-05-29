'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { FileText, Calendar, ExternalLink, AlertTriangle } from 'lucide-react';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { formatDate } from '../../lib/utils';

interface SupplierDocumentsTabProps {
  documents: any[];
}

export const SupplierDocumentsTab: React.FC<SupplierDocumentsTabProps> = ({ documents }) => {
  const isExpired = (date: string) => new Date(date) < new Date();
  const isExpiringSoon = (date: string) => {
    const expiry = new Date(date);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    return expiry > new Date() && expiry < soon;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500">No documents uploaded.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>{doc.documentType}</TableCell>
                  <TableCell>
                    {doc.expiryDate ? (
                      <div className="flex items-center gap-2">
                        <span className={isExpired(doc.expiryDate) ? 'text-red-600 font-bold' : ''}>
                          {formatDate(doc.expiryDate)}
                        </span>
                        {isExpired(doc.expiryDate) && <AlertTriangle className="h-3 w-3 text-red-600" />}
                        {isExpiringSoon(doc.expiryDate) && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                      </div>
                    ) : 'No Expiry'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
