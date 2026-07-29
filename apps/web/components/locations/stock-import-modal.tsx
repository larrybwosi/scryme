"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  ArrowRight,
  Search,
  Check,
  RefreshCw,
  Eye,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { stringSimilarity } from "../../lib/fuzzy";
import { getAllOrganizationVariants } from "../../app/actions/locations";
import { bulkUpdateLocationStock } from "../../app/actions/stock-management";

type Step = "UPLOAD" | "MAPPING" | "MATCHING" | "PREVIEW" | "RESULTS";

interface RowData {
  [key: string]: any;
}

interface MappedField {
  key: string;
  label: string;
  required: boolean;
}

const FIELDS: MappedField[] = [
  { key: "productName", label: "Product Name", required: true },
  { key: "variantName", label: "Variant Name", required: false },
  { key: "sku", label: "SKU", required: false },
  { key: "barcode", label: "Barcode", required: false },
  { key: "stock", label: "New Total Stock", required: true },
];

interface SystemVariant {
  id: string;
  sku: string;
  barcode: string | null;
  name: string; // Product name
  variantName: string; // Variant name
  currentStock: number;
}

interface RowMatch {
  index: number;
  originalRow: RowData;
  // User mappings
  rawProductName: string;
  rawVariantName: string;
  rawSku: string;
  rawBarcode: string;
  rawStock: number;

  // Matched variant info
  matchedVariantId: string | null;
  matchedVariant: SystemVariant | null;
  matchScore: number; // 0 to 1
  isSkipped: boolean;
  manuallyAssigned: boolean;
}

export function StockImportModal({
  locationId,
  locationName,
  onImportSuccess,
  children,
}: {
  locationId: string;
  locationName: string;
  onImportSuccess?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<RowData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  // System variants fetched for fuzzy matching
  const [systemVariants, setSystemVariants] = useState<SystemVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Row matching states
  const [rowMatches, setRowMatches] = useState<RowMatch[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "needs-review" | "matched" | "skipped">("all");
  const [matchingSearch, setMatchingSearch] = useState("");
  const [matchingPage, setMatchingPage] = useState(1);
  const itemsPerPage = 8;

  // Final actions
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    total: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("UPLOAD");
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setMappings({});
    setSystemVariants([]);
    setRowMatches([]);
    setActiveTab("all");
    setMatchingSearch("");
    setMatchingPage(1);
    setIsImporting(false);
    setResults(null);
  };

  // Fetch all variants when modal is opened or location changes
  useEffect(() => {
    if (open && locationId) {
      setLoadingVariants(true);
      getAllOrganizationVariants(locationId)
        .then((data) => {
          setSystemVariants(data as SystemVariant[]);
        })
        .catch((err) => {
          console.error("Error fetching system variants:", err);
          toast.error("Failed to load system variants for matching");
        })
        .finally(() => {
          setLoadingVariants(false);
        });
    }
  }, [open, locationId]);

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    const isCsv = selectedFile.name.endsWith(".csv");
    const isExcel =
      selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls");

    if (!isCsv && !isExcel) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setFile(selectedFile);

    if (isCsv) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          handleDataParsed(results.data);
        },
        error: (error) => {
          toast.error(`Error parsing CSV: ${error.message}`);
        },
      });
    } else {
      try {
        const data = await parseExcel(selectedFile);
        handleDataParsed(data);
      } catch (error: any) {
        toast.error(`Error parsing Excel: ${error.message}`);
      }
    }
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const bstr = e.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsBinaryString(file);
    });
  };

  const handleDataParsed = (data: any[]) => {
    if (data.length === 0) {
      toast.error("The file is empty");
      return;
    }
    setRawData(data);
    const firstRowHeaders = Object.keys(data[0]);
    setHeaders(firstRowHeaders);

    // Auto-mapping attempt based on column names
    const initialMappings: Record<string, string> = {};
    FIELDS.forEach((field) => {
      const match = firstRowHeaders.find(
        (h) =>
          h.toLowerCase() === field.label.toLowerCase() ||
          h.toLowerCase() === field.key.toLowerCase() ||
          (field.key === "productName" && h.toLowerCase().includes("product")) ||
          (field.key === "stock" && (h.toLowerCase().includes("qty") || h.toLowerCase().includes("stock") || h.toLowerCase().includes("count")))
      );
      if (match) initialMappings[field.key] = match;
    });

    setMappings(initialMappings);
    setStep("MAPPING");
  };

  // Perform Fuzzy Matching across all rows
  const performFuzzyMatching = () => {
    const productNameHeader = mappings.productName;
    const variantNameHeader = mappings.variantName;
    const skuHeader = mappings.sku;
    const barcodeHeader = mappings.barcode;
    const stockHeader = mappings.stock;

    if (!productNameHeader || !stockHeader) {
      toast.error("Please map Product Name and New Total Stock columns");
      return;
    }

    const matches: RowMatch[] = rawData.map((row, index) => {
      const rawProductName = String(row[productNameHeader] || "").trim();
      const rawVariantName = variantNameHeader ? String(row[variantNameHeader] || "").trim() : "";
      const rawSku = skuHeader ? String(row[skuHeader] || "").trim() : "";
      const rawBarcode = barcodeHeader ? String(row[barcodeHeader] || "").trim() : "";
      const rawStock = parseFloat(String(row[stockHeader] || "0")) || 0;

      let matchedVariant: SystemVariant | null = null;
      let highestScore = 0;
      let matchedVariantId: string | null = null;

      // 1. Exact SKU Match (High priority)
      if (rawSku) {
        const exactSku = systemVariants.find(
          (v) => v.sku.toLowerCase() === rawSku.toLowerCase()
        );
        if (exactSku) {
          matchedVariant = exactSku;
          highestScore = 1.0;
          matchedVariantId = exactSku.id;
        }
      }

      // 2. Exact Barcode Match (High priority)
      if (!matchedVariantId && rawBarcode) {
        const exactBarcode = systemVariants.find(
          (v) => v.barcode && v.barcode.toLowerCase() === rawBarcode.toLowerCase()
        );
        if (exactBarcode) {
          matchedVariant = exactBarcode;
          highestScore = 1.0;
          matchedVariantId = exactBarcode.id;
        }
      }

      // 3. Fuzzy Name Match
      if (!matchedVariantId && rawProductName) {
        const userSearchString = rawVariantName
          ? `${rawProductName} ${rawVariantName}`
          : rawProductName;

        systemVariants.forEach((systemVar) => {
          const sysNameString =
            systemVar.variantName && systemVar.variantName !== "Default"
              ? `${systemVar.name} ${systemVar.variantName}`
              : systemVar.name;

          // Compute string similarity
          const score = stringSimilarity(userSearchString, sysNameString);
          if (score > highestScore) {
            highestScore = score;
            matchedVariant = systemVar;
            matchedVariantId = systemVar.id;
          }
        });
      }

      return {
        index,
        originalRow: row,
        rawProductName,
        rawVariantName,
        rawSku,
        rawBarcode,
        rawStock,
        matchedVariantId,
        matchedVariant,
        matchScore: highestScore,
        isSkipped: false,
        manuallyAssigned: false,
      };
    });

    // Sort by match score descending to show higher matches first, or group nicely
    // We keep their original positions but we'll sort them in the view.
    setRowMatches(matches);
    setStep("MATCHING");
  };

  // Modify manual mapping
  const assignManualMatch = (rowIndex: number, systemVar: SystemVariant) => {
    setRowMatches((prev) =>
      prev.map((m) => {
        if (m.index === rowIndex) {
          return {
            ...m,
            matchedVariantId: systemVar.id,
            matchedVariant: systemVar,
            matchScore: 1.0, // Treat manual assignment as perfect match
            manuallyAssigned: true,
            isSkipped: false,
          };
        }
        return m;
      })
    );
  };

  // Toggle skipping a row
  const toggleSkipRow = (rowIndex: number) => {
    setRowMatches((prev) =>
      prev.map((m) => {
        if (m.index === rowIndex) {
          return { ...m, isSkipped: !m.isSkipped };
        }
        return m;
      })
    );
  };

  // Statistics for UI
  const stats = useMemo(() => {
    const total = rowMatches.length;
    const skipped = rowMatches.filter((m) => m.isSkipped).length;
    const active = rowMatches.filter((m) => !m.isSkipped);
    const autoMatchedHigh = active.filter((m) => m.matchScore >= 0.9 && !m.manuallyAssigned).length;
    const needsReview = active.filter((m) => m.matchScore < 0.9 || !m.matchedVariantId).length;

    return {
      total,
      skipped,
      autoMatchedHigh,
      needsReview,
    };
  }, [rowMatches]);

  // Filtering row matches
  const filteredMatches = useMemo(() => {
    return rowMatches
      .filter((m) => {
        // Tab filter
        if (activeTab === "skipped") return m.isSkipped;
        if (m.isSkipped) return false; // Hide skipped from other tabs

        if (activeTab === "needs-review") {
          return m.matchScore < 0.9 || !m.matchedVariantId;
        }
        if (activeTab === "matched") {
          return m.matchScore >= 0.9 && m.matchedVariantId !== null;
        }
        return true; // "all"
      })
      .filter((m) => {
        // Search filter
        if (!matchingSearch) return true;
        const searchLower = matchingSearch.toLowerCase();
        return (
          m.rawProductName.toLowerCase().includes(searchLower) ||
          m.rawSku.toLowerCase().includes(searchLower) ||
          m.rawVariantName.toLowerCase().includes(searchLower) ||
          (m.matchedVariant?.name || "").toLowerCase().includes(searchLower) ||
          (m.matchedVariant?.variantName || "").toLowerCase().includes(searchLower) ||
          (m.matchedVariant?.sku || "").toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        // Place lower match scores on top to highlight things needing review,
        // or sort by manual review necessity
        const aNeedsReview = a.matchScore < 0.9 || !a.matchedVariantId;
        const bNeedsReview = b.matchScore < 0.9 || !b.matchedVariantId;
        if (aNeedsReview && !bNeedsReview) return -1;
        if (!aNeedsReview && bNeedsReview) return 1;
        return b.matchScore - a.matchScore; // descending score
      });
  }, [rowMatches, activeTab, matchingSearch]);

  // Handle pagination
  useEffect(() => {
    setMatchingPage(1);
  }, [activeTab, matchingSearch]);

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const paginatedMatches = useMemo(() => {
    const startIndex = (matchingPage - 1) * itemsPerPage;
    return filteredMatches.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMatches, matchingPage]);

  // Execute Import
  const handleImportExecute = async () => {
    const activeMatches = rowMatches.filter((m) => !m.isSkipped && m.matchedVariantId);
    if (activeMatches.length === 0) {
      toast.error("No valid matched items to import.");
      return;
    }

    setIsImporting(true);
    try {
      const updates = activeMatches.map((m) => ({
        variantId: m.matchedVariantId!,
        newTotalStock: m.rawStock,
      }));

      const res = await bulkUpdateLocationStock(locationId, updates);
      if (res.success) {
        setResults({
          success: activeMatches.length,
          failed: 0,
          total: activeMatches.length,
        });
        setStep("RESULTS");
        toast.success(res.message || "Stock imported successfully");
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        toast.error("Import failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to import stock variants");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = (format: "csv" | "xlsx") => {
    const data = [
      {
        "Product Name": "Chocolate Croissant",
        "Variant Name": "Single",
        SKU: "CRO-CHOC-01",
        Barcode: "111222333",
        "New Total Stock": 45,
      },
      {
        "Product Name": "Fresh Sourdough Bread",
        "Variant Name": "Large Loaf",
        SKU: "BREAD-SOUR-LG",
        Barcode: "444555666",
        "New Total Stock": 20,
      },
      {
        "Product Name": "Espresso Coffee Beans",
        "Variant Name": "Default",
        SKU: "COFFEE-ESP-KG",
        Barcode: "",
        "New Total Stock": 15,
      },
    ];

    if (format === "csv") {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "stock_import_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Updates");
      XLSX.writeFile(workbook, "stock_import_template.xlsx");
    }
  };

  const isMappingValid = FIELDS.filter((f) => f.required).every((f) => !!mappings[f.key]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-6 scrollbar-thin">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Import / Update Stock via Excel &bull; <span className="text-emerald-700 font-medium">{locationName}</span>
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: UPLOAD */}
        {step === "UPLOAD" && (
          <div className="space-y-6 pt-2">
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-12 h-12 mb-4 text-slate-400" />
              <h3 className="mb-2 text-[15px] font-semibold text-slate-800">
                Upload your stock Excel or CSV sheet
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                Supports .xlsx, .xls, .csv files up to 10MB
              </p>
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm">
                Choose File
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={onFileUpload}
                onClick={(e) => (e.target as any).value = null}
              />
            </div>

            <div className="p-5 bg-slate-50 border border-slate-150 rounded-lg">
              <h4 className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-800">
                <Download className="w-4 h-4 text-emerald-600" />
                Want a pre-formatted template?
              </h4>
              <p className="mb-4 text-xs text-slate-600 leading-relaxed">
                Download a starter spreadsheet containing the key headers (Product Name, Variant Name, SKU, Barcode, and New Total Stock) to make import pairing absolutely seamless.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate("csv")}
                  className="bg-white border-slate-250 hover:bg-slate-100 text-xs rounded-sm text-slate-700"
                >
                  Download CSV Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate("xlsx")}
                  className="bg-white border-slate-250 hover:bg-slate-100 text-xs rounded-sm text-slate-700"
                >
                  Download Excel Template
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === "MAPPING" && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="font-semibold text-sm text-slate-900">Map Columns to System Properties</h4>
                  <p className="text-xs text-slate-500 mt-1">Specify which headers from your file match system fields.</p>
                </div>
                <div className="space-y-4">
                  {FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      <Select
                        value={mappings[field.key] || "none"}
                        onValueChange={(val) =>
                          setMappings((prev) => ({ ...prev, [field.key]: val === "none" ? "" : val }))
                        }
                      >
                        <SelectTrigger className="h-9 rounded-sm border-slate-200">
                          <SelectValue placeholder={`Select spreadsheet column for ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {!field.required && <SelectItem value="none">Ignore (None)</SelectItem>}
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-slate-50/50">
                <h4 className="mb-3 font-semibold text-xs text-slate-800 uppercase tracking-wider">
                  Spreadsheet Row Preview (First 3 items)
                </h4>
                <div className="space-y-3">
                  {rawData.slice(0, 3).map((row, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white border border-slate-150 rounded shadow-sm text-xs space-y-1.5"
                    >
                      <div className="font-semibold text-[11px] text-slate-400 pb-1 border-b border-dashed">
                        Row #{i + 1}
                      </div>
                      {Object.entries(mappings).map(
                        ([key, header]) =>
                          header && (
                            <div key={key} className="flex justify-between items-center py-0.5">
                              <span className="text-slate-400 text-[11px]">
                                {FIELDS.find((f) => f.key === key)?.label}:
                              </span>
                              <span className="font-medium text-slate-800 font-mono text-[11.5px]">
                                {row[header]}
                              </span>
                            </div>
                          )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setStep("UPLOAD")}>
                Back
              </Button>
              <Button
                disabled={!isMappingValid}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm"
                onClick={performFuzzyMatching}
              >
                Continue to Matching
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3: MATCHING */}
        {step === "MATCHING" && (
          <div className="space-y-4 pt-1">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800">
                <p className="font-semibold">Fuzzy Match Assistance</p>
                <p className="mt-1 leading-normal">
                  We scanned <strong>{rowMatches.length} rows</strong> against <strong>{systemVariants.length} active variants</strong>. Items with <strong>&gt;= 90% confidence</strong> are auto-assigned. Review the medium/low matches, search for correct items, or exclude items using the toggle.
                </p>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 border rounded-lg">
              <div className="text-center py-1">
                <div className="text-lg font-bold text-slate-900">{stats.total}</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">Total Rows</div>
              </div>
              <div className="text-center py-1 border-l">
                <div className="text-lg font-bold text-emerald-600">{stats.autoMatchedHigh}</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">Auto-Matched</div>
              </div>
              <div className="text-center py-1 border-l">
                <div className="text-lg font-bold text-amber-500">{stats.needsReview}</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">Needs Review</div>
              </div>
              <div className="text-center py-1 border-l">
                <div className="text-lg font-bold text-slate-500">{stats.skipped}</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">Skipped</div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex bg-slate-100 p-0.5 rounded-md w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  All ({rowMatches.filter(m => !m.isSkipped).length})
                </button>
                <button
                  onClick={() => setActiveTab("needs-review")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "needs-review" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Needs Review ({rowMatches.filter(m => !m.isSkipped && (m.matchScore < 0.9 || !m.matchedVariantId)).length})
                </button>
                <button
                  onClick={() => setActiveTab("matched")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "matched" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Auto-Matched ({rowMatches.filter(m => !m.isSkipped && m.matchScore >= 0.9).length})
                </button>
                <button
                  onClick={() => setActiveTab("skipped")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "skipped" ? "bg-white text-slate-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Skipped ({rowMatches.filter(m => m.isSkipped).length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Search file rows..."
                  value={matchingSearch}
                  onChange={(e) => setMatchingSearch(e.target.value)}
                  className="pl-8 h-8 text-xs border-slate-200 focus-visible:ring-emerald-500 rounded-sm"
                />
              </div>
            </div>

            {/* Match rows list */}
            <div className="border rounded-lg overflow-hidden bg-white max-h-[350px] overflow-y-auto">
              {paginatedMatches.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No items match the selected filter.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[80px] text-xs">Action</TableHead>
                      <TableHead className="text-xs">File Product Variant / SKU</TableHead>
                      <TableHead className="text-xs">Matched System Variant</TableHead>
                      <TableHead className="w-[120px] text-xs text-right">Import Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {paginatedMatches.map((match) => {
                      const isHighMatch = match.matchScore >= 0.9;
                      const hasMatch = !!match.matchedVariantId;
                      const isSkipped = match.isSkipped;

                      return (
                        <TableRow
                          key={match.index}
                          className={`hover:bg-slate-50/50 transition-colors ${isSkipped ? "opacity-50 bg-slate-50/30" : ""}`}
                        >
                          <TableCell>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => toggleSkipRow(match.index)}
                              className={`h-6 text-[10px] font-semibold tracking-wide uppercase px-2 rounded-sm ${
                                isSkipped
                                  ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {isSkipped ? "Include" : "Skip"}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 text-[13px]">
                                {match.rawProductName}
                                {match.rawVariantName && (
                                  <span className="text-slate-400 font-normal"> &bull; {match.rawVariantName}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                {match.rawSku && <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">SKU: {match.rawSku}</span>}
                                {match.rawBarcode && <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">Barcode: {match.rawBarcode}</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {!isSkipped ? (
                              <div className="flex items-center justify-between gap-2 max-w-sm">
                                {hasMatch ? (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-slate-800 text-[13px]">
                                        {match.matchedVariant?.name}
                                        {match.matchedVariant?.variantName && match.matchedVariant?.variantName !== "Default" && (
                                          <span className="text-slate-400 font-normal"> &bull; {match.matchedVariant?.variantName}</span>
                                        )}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`rounded-full px-1.5 py-0 text-[9px] font-bold ${
                                          isHighMatch
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : "border-amber-200 bg-amber-50 text-amber-700"
                                        }`}
                                      >
                                        {Math.round(match.matchScore * 100)}% Match
                                      </Badge>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      System SKU: {match.matchedVariant?.sku}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> No match found
                                  </div>
                                )}

                                {/* Popover selector for matching override */}
                                <SystemVariantSelector
                                  systemVariants={systemVariants}
                                  onSelect={(variant) => assignManualMatch(match.index, variant)}
                                >
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    className="h-7 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 px-2 rounded-sm"
                                  >
                                    Change Match
                                  </Button>
                                </SystemVariantSelector>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Skipped</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono font-bold text-slate-800 text-[13px]">
                              {match.rawStock}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Matching Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-1">
                <div className="text-xs text-slate-400">
                  Showing matches <span className="font-medium text-slate-600">{Math.min(filteredMatches.length, (matchingPage - 1) * itemsPerPage + 1)}-{Math.min(filteredMatches.length, matchingPage * itemsPerPage)}</span> of <span className="font-medium text-slate-600">{filteredMatches.length}</span> rows
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setMatchingPage(prev => Math.max(1, prev - 1))}
                    disabled={matchingPage === 1}
                    className="border-slate-200 rounded-sm"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
                  </Button>
                  <span className="text-[11px] font-medium text-slate-500 px-1">
                    Page {matchingPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setMatchingPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={matchingPage === totalPages}
                    className="border-slate-200 rounded-sm"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setStep("MAPPING")}>
                Back
              </Button>
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm"
                onClick={() => setStep("PREVIEW")}
              >
                Preview Changes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 4: PREVIEW */}
        {step === "PREVIEW" && (
          <div className="space-y-6 pt-2">
            <div className="p-4 border rounded-xl bg-slate-50/50">
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Final Import Verification</h4>
              <p className="text-xs text-slate-600 leading-normal">
                Please verify the summary below before executing the absolute stock updates. These updates will perform database corrections, log stock adjustments and inventory count audit history.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                <div className="text-3xl font-extrabold text-emerald-700">
                  {rowMatches.filter((m) => !m.isSkipped && m.matchedVariantId).length}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold tracking-wide uppercase mt-1">Variants to Update</div>
              </div>
              <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 text-center">
                <div className="text-3xl font-extrabold text-slate-700">
                  {rowMatches.filter((m) => m.isSkipped).length}
                </div>
                <div className="text-[11px] text-slate-600 font-semibold tracking-wide uppercase mt-1">Rows Skipped</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-center">
                <div className="text-3xl font-extrabold text-amber-700">
                  {rowMatches.filter((m) => !m.isSkipped && !m.matchedVariantId).length}
                </div>
                <div className="text-[11px] text-amber-600 font-semibold tracking-wide uppercase mt-1">Unmatched (Will be Ignored)</div>
              </div>
            </div>

            {/* List first 15 of planned updates */}
            <div className="border rounded-lg overflow-hidden bg-white max-h-[250px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs">Product Variant</TableHead>
                    <TableHead className="text-xs">Current Stock</TableHead>
                    <TableHead className="text-xs">New Target Stock</TableHead>
                    <TableHead className="text-xs text-right">Adjustment Delta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y text-xs">
                  {rowMatches
                    .filter((m) => !m.isSkipped && m.matchedVariantId)
                    .slice(0, 15)
                    .map((m, i) => {
                      const delta = m.rawStock - (m.matchedVariant?.currentStock || 0);
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-semibold text-slate-800">
                            {m.matchedVariant?.name}
                            {m.matchedVariant?.variantName && m.matchedVariant?.variantName !== "Default" && (
                              <span className="text-slate-400 font-normal"> &bull; {m.matchedVariant?.variantName}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono">{m.matchedVariant?.currentStock ?? 0}</TableCell>
                          <TableCell className="font-mono text-emerald-700 font-bold">{m.rawStock}</TableCell>
                          <TableCell className={`text-right font-mono font-semibold ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-slate-500"}`}>
                            {delta > 0 ? `+${delta}` : delta === 0 ? "0" : delta}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              {rowMatches.filter((m) => !m.isSkipped && m.matchedVariantId).length > 15 && (
                <div className="text-center p-2.5 text-xs text-slate-400 border-t bg-slate-50">
                  And {rowMatches.filter((m) => !m.isSkipped && m.matchedVariantId).length - 15} more updates...
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setStep("MATCHING")} disabled={isImporting}>
                Back
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm"
                onClick={handleImportExecute}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating stock...
                  </>
                ) : (
                  <>
                    Apply Absolute Stock Updates
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 5: RESULTS */}
        {step === "RESULTS" && results && (
          <div className="space-y-6 pt-2 text-center py-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Stock Update Complete</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Successfully updated <strong>{results.success}</strong> product variants with the new absolute stock counts at <strong>{locationName}</strong>.
              </p>
            </div>

            <DialogFooter className="justify-center border-t pt-4">
              <Button
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm w-full max-w-xs"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Subcomponent: Fuzzy Searchable System Variant Selector inside Popover
function SystemVariantSelector({
  systemVariants,
  onSelect,
  children,
}: {
  systemVariants: SystemVariant[];
  onSelect: (variant: SystemVariant) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return systemVariants.slice(0, 100); // capped at 100 for speed
    const searchLower = search.toLowerCase();
    return systemVariants
      .filter(
        (v) =>
          v.name.toLowerCase().includes(searchLower) ||
          v.sku.toLowerCase().includes(searchLower) ||
          (v.variantName && v.variantName.toLowerCase().includes(searchLower)) ||
          (v.barcode && v.barcode.toLowerCase().includes(searchLower))
      )
      .slice(0, 50); // limit lookup count for smoothness
  }, [search, systemVariants]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[320px] p-2" align="end">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search product, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs border-slate-200 focus-visible:ring-emerald-500"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto divide-y text-xs">
            {filtered.length === 0 ? (
              <p className="p-3 text-center text-slate-400 italic">No variants found</p>
            ) : (
              filtered.map((v) => (
                <button
                  key={v.id}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 rounded"
                  onClick={() => {
                    onSelect(v);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold text-slate-800 text-[12px]">
                    {v.name}
                    {v.variantName && v.variantName !== "Default" && (
                      <span className="text-slate-400 font-normal"> &bull; {v.variantName}</span>
                    )}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">SKU: {v.sku}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
