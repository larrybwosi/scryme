"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Columns3,
  Download,
  UserPlus,
  FileText,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { CrmObjectDefinition, CrmRecord, CrmFieldType } from "../types";

interface CrmDataTableProps {
  objectDefinition: CrmObjectDefinition & { fields: any[] };
  records: CrmRecord[];
  onRecordClick?: (record: CrmRecord) => void;
  onEdit?: (record: CrmRecord) => void;
  onDelete?: (record: CrmRecord) => void;
  onBulkDelete?: (records: CrmRecord[]) => void;
  onBulkAssign?: (records: CrmRecord[]) => void;
  onExport?: (records: CrmRecord[]) => void;
}

type SortDirection = "asc" | "desc" | null;

const formatFieldValue = (value: any, type: CrmFieldType): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (type) {
    case CrmFieldType.EMAIL: {
      return (
        <a
          href={`mailto:${value}`}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );
    }
    case CrmFieldType.PHONE: {
      return (
        <a
          href={`tel:${value}`}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );
    }
    case CrmFieldType.URL: {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline truncate max-w-[200px] block"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );
    }
    case CrmFieldType.DATE: {
      try {
        return new Date(value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return value;
      }
    }
    case CrmFieldType.NUMBER: {
      return typeof value === "number" ? value.toLocaleString() : value;
    }
    case CrmFieldType.BOOLEAN: {
      return (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? "Yes" : "No"}
        </Badge>
      );
    }
    case CrmFieldType.SELECT: {
      return (
        <Badge variant="outline" className="text-xs font-medium">
          {value}
        </Badge>
      );
    }
    case CrmFieldType.MULTI_SELECT: {
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 2).map((v, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {v}
              </Badge>
            ))}
            {value.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{value.length - 2}
              </Badge>
            )}
          </div>
        );
      }
      return value;
    }
    default: {
      const stringValue = String(value);
      if (stringValue.length > 50) {
        return <span title={stringValue}>{stringValue.slice(0, 50)}...</span>;
      }
      return stringValue;
    }
  }
};

export const CrmDataTable: React.FC<CrmDataTableProps> = ({
  objectDefinition,
  records,
  onRecordClick,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkAssign,
  onExport,
}) => {
  const fields = objectDefinition.fields;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(fields.map((f: any) => f.name)),
  );

  const allSelected = records.length > 0 && selectedIds.size === records.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < records.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSort = (fieldName: string) => {
    if (sortField === fieldName) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(fieldName);
      setSortDirection("asc");
    }
  };

  const sortedRecords = useMemo(() => {
    if (!sortField || !sortDirection) return records;

    return [...records].sort((a, b) => {
      const aValue = (a.data as any)[sortField];
      const bValue = (b.data as any)[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = String(aValue).localeCompare(
        String(bValue),
        undefined,
        { numeric: true },
      );
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [records, sortField, sortDirection]);

  const selectedRecords = records.filter((r) => selectedIds.has(r.id));
  const visibleFields = fields.filter((f: any) => visibleColumns.has(f.name));

  return (
    <div className="w-full">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b">
          <span className="text-sm font-medium">
            {selectedIds.size} record{selectedIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex items-center gap-2">
            {onBulkAssign && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAssign(selectedRecords)}
                className="h-7 gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign
              </Button>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport(selectedRecords)}
                className="h-7 gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}
            {onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkDelete(selectedRecords)}
                className="h-7 gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Column Visibility Toggle */}
      <div className="flex items-center justify-end px-4 py-2 border-b bg-muted/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5">
              <Columns3 className="h-3.5 w-3.5" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {fields.map((field: any) => (
              <DropdownMenuCheckboxItem
                key={field.id}
                checked={visibleColumns.has(field.name)}
                onCheckedChange={(checked) => {
                  const newVisible = new Set(visibleColumns);
                  if (checked) {
                    newVisible.add(field.name);
                  } else {
                    newVisible.delete(field.name);
                  }
                  setVisibleColumns(newVisible);
                }}
              >
                {field.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) (el as any).indeterminate = someSelected;
                }}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            {visibleFields.map((field: any) => (
              <TableHead
                key={field.id}
                className="cursor-pointer select-none"
                onClick={() => handleSort(field.name)}
              >
                <div className="flex items-center gap-1.5">
                  {field.label}
                  {sortField === field.name ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRecords.length > 0 ? (
            sortedRecords.map((record) => {
              const isSelected = selectedIds.has(record.id);
              return (
                <TableRow
                  key={record.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected && "bg-primary/5",
                  )}
                  onClick={() => onRecordClick?.(record)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectRow(record.id)}
                      aria-label={`Select record ${record.id}`}
                    />
                  </TableCell>
                  {visibleFields.map((field: any) => {
                    const value = (record.data as any)[field.name];
                    return (
                      <TableCell key={field.id} className="py-3">
                        {formatFieldValue(value, field.type)}
                      </TableCell>
                    );
                  })}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onRecordClick?.(record)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(record)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard.writeText(record.id)
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy ID
                        </DropdownMenuItem>
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(record)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={visibleFields.length + 2}
                className="h-32 text-center"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No records found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Create your first {objectDefinition.label.toLowerCase()} to
                    get started
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
