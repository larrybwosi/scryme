"use client";

import React, { useState, useRef } from "react";
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
  Upload,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { importProducts, type ProductImportData } from "../../app/actions/inventory";

type Step = "UPLOAD" | "MAPPING" | "PREVIEW" | "RESULTS";

const REQUIRED_FIELDS = [
  { key: "name", label: "Product Name" },
  { key: "sku", label: "SKU" },
  { key: "categoryName", label: "Category" },
  { key: "buyingPrice", label: "Buying Price" },
  { key: "retailPrice", label: "Retail Price" },
];

const OPTIONAL_FIELDS = [
  { key: "initialStock", label: "Default Variant Stock" },
  { key: "description", label: "Description" },
  { key: "barcode", label: "Barcode" },
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export function ProductImport({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [strategy, setStrategy] = useState<"skip" | "replace">("skip");
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    skipped: number;
    replaced: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("UPLOAD");
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMappings({});
    setStrategy("skip");
    setIsImporting(false);
    setResults(null);
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error("The CSV file is empty");
          return;
        }
        const data = results.data as any[];
        setCsvData(data);
        setHeaders(Object.keys(data[0]));

        // Auto-mapping attempt
        const initialMappings: Record<string, string> = {};
        const csvHeaders = Object.keys(data[0]);

        ALL_FIELDS.forEach(field => {
            const match = csvHeaders.find(h =>
                h.toLowerCase() === field.label.toLowerCase() ||
                h.toLowerCase() === field.key.toLowerCase()
            );
            if (match) initialMappings[field.key] = match;
        });

        setMappings(initialMappings);
        setStep("MAPPING");
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const productsToImport: ProductImportData[] = csvData.map((row) => ({
        name: String(row[mappings.name] || ""),
        sku: String(row[mappings.sku] || ""),
        categoryName: String(row[mappings.categoryName] || "Uncategorized"),
        buyingPrice: parseFloat(row[mappings.buyingPrice]) || 0,
        retailPrice: parseFloat(row[mappings.retailPrice]) || 0,
        initialStock: mappings.initialStock ? (parseInt(row[mappings.initialStock]) || 0) : 0,
        description: mappings.description ? String(row[mappings.description] || "") : undefined,
        barcode: mappings.barcode ? String(row[mappings.barcode] || "") : undefined,
      }));

      const res = await importProducts(productsToImport, strategy);
      setResults(res);
      setStep("RESULTS");
      toast.success("Import completed");
    } catch (error: any) {
      toast.error(error.message || "Failed to import products");
    } finally {
      setIsImporting(false);
    }
  };

  const isMappingValid = REQUIRED_FIELDS.every(field => !!mappings[field.key]);

  return (
    <Dialog open={open} onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Products
          </DialogTitle>
        </DialogHeader>

        {step === "UPLOAD" && (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-gray-50/50 border-gray-200">
            <Upload className="w-12 h-12 mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium">Upload your CSV file</h3>
            <p className="mb-6 text-sm text-gray-500">Maximum file size 10MB</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Select File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={onFileUpload}
            />
          </div>
        )}

        {step === "MAPPING" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Map CSV Headers</h4>
                <div className="space-y-4">
                  {REQUIRED_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="flex items-center gap-1">
                        {field.label}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={mappings[field.key]}
                        onValueChange={(val) => setMappings(prev => ({ ...prev, [field.key]: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CSV header" />
                        </SelectTrigger>
                        <SelectContent>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <h5 className="mb-4 text-sm font-medium text-gray-500">Optional Fields</h5>
                    {OPTIONAL_FIELDS.map((field) => (
                      <div key={field.key} className="space-y-1.5 mb-4">
                        <Label>{field.label}</Label>
                        <Select
                          value={mappings[field.key]}
                          onValueChange={(val) => setMappings(prev => ({ ...prev, [field.key]: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CSV header (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
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
              </div>
              <div className="p-4 border rounded-lg bg-gray-50/50">
                <h4 className="mb-4 font-semibold text-gray-900">Preview (First 3 rows)</h4>
                <div className="space-y-4">
                   {csvData.slice(0, 3).map((row, i) => (
                       <div key={i} className="p-3 bg-white border rounded shadow-sm text-xs space-y-1">
                           {Object.entries(mappings).map(([key, header]) => (
                               header && header !== "none" && (
                                   <div key={key} className="flex justify-between">
                                       <span className="text-gray-500">{header}:</span>
                                       <span className="font-medium">{row[header]}</span>
                                   </div>
                               )
                           ))}
                       </div>
                   ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("UPLOAD")}>Back</Button>
              <Button disabled={!isMappingValid} onClick={() => setStep("PREVIEW")}>
                Continue to Preview
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "PREVIEW" && (
          <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium">Import Summary</p>
                    <p>You are about to import {csvData.length} products. Existing products with the same SKU will be handled based on your selection below.</p>
                </div>
            </div>

            <div className="space-y-3">
                <Label>Duplicate SKU Strategy</Label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        className={`p-4 border rounded-lg text-left transition-all ${strategy === "skip" ? "border-black bg-black/5 ring-1 ring-black" : "border-gray-200 hover:border-gray-300"}`}
                        onClick={() => setStrategy("skip")}
                    >
                        <div className="font-medium">Skip</div>
                        <div className="text-xs text-gray-500">Keep existing product data and ignore duplicates in CSV.</div>
                    </button>
                    <button
                        className={`p-4 border rounded-lg text-left transition-all ${strategy === "replace" ? "border-black bg-black/5 ring-1 ring-black" : "border-gray-200 hover:border-gray-300"}`}
                        onClick={() => setStrategy("replace")}
                    >
                        <div className="font-medium">Replace / Update</div>
                        <div className="text-xs text-gray-500">Overwrite existing product details with data from CSV.</div>
                    </button>
                </div>
            </div>

            <div className="max-h-[300px] overflow-auto border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {REQUIRED_FIELDS.map(f => (
                                <TableHead key={f.key}>{f.label}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {csvData.slice(0, 10).map((row, i) => (
                            <TableRow key={i}>
                                {REQUIRED_FIELDS.map(f => (
                                    <TableCell key={f.key}>{row[mappings[f.key]]}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {csvData.length > 10 && (
                    <div className="p-3 text-center text-xs text-gray-500 border-t">
                        And {csvData.length - 10} more rows...
                    </div>
                )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("MAPPING")} disabled={isImporting}>Back</Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                    </>
                ) : (
                    <>
                        Start Import
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "RESULTS" && results && (
            <div className="space-y-6 py-4">
                <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
                        <div className="text-2xl font-bold text-green-700">{results.success}</div>
                        <div className="text-xs text-green-600 font-medium">New Products</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                        <div className="text-2xl font-bold text-blue-700">{results.replaced}</div>
                        <div className="text-xs text-blue-600 font-medium">Updated</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-center">
                        <div className="text-2xl font-bold text-yellow-700">{results.skipped}</div>
                        <div className="text-xs text-yellow-600 font-medium">Skipped</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-center">
                        <div className="text-2xl font-bold text-red-700">{results.failed}</div>
                        <div className="text-xs text-red-600 font-medium">Failed</div>
                    </div>
                </div>

                {results.errors.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900">Errors:</h4>
                        <div className="max-h-[200px] overflow-y-auto p-3 bg-gray-50 border rounded-lg text-xs space-y-1 font-mono">
                            {results.errors.map((err, i) => (
                                <div key={i} className="text-red-600 flex gap-2">
                                    <span className="shrink-0">•</span>
                                    <span>{err}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
