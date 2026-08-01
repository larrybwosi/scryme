"use client";

import React from "react";
import { Globe, Layers, Trash2, Plus } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

interface CustomAttribute {
  id: string;
  key: string;
  value: string;
}

interface SEOTabProps {
  seo: { title: string; description: string; keywords: string };
  setSeo: React.Dispatch<React.SetStateAction<{ title: string; description: string; keywords: string }>>;
  customAttrs: CustomAttribute[];
  setCustomAttrs: React.Dispatch<React.SetStateAction<CustomAttribute[]>>;
  newAttrKey: string;
  setNewAttrKey: (v: string) => void;
  newAttrValue: string;
  setNewAttrValue: (v: string) => void;
  handleAddCustomAttr: () => void;
  handleRemoveCustomAttr: (id: string) => void;
}

export function SEOTab({
  seo,
  setSeo,
  customAttrs,
  setCustomAttrs,
  newAttrKey,
  setNewAttrKey,
  newAttrValue,
  setNewAttrValue,
  handleAddCustomAttr,
  handleRemoveCustomAttr,
}: SEOTabProps) {
  return (
    <div className="space-y-6">
      {/* SEO parameters block */}
      <div className="bg-white p-6 border shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Globe size={18} className="text-[#c89a4b]" />
            <span>Search Engine Optimization (SEO) Fields</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Define custom metadata used by storefront crawlers, Google searches, and social sharing snippets.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="seo-title" className="text-xs font-bold uppercase tracking-wider text-slate-500">SEO Meta Title</Label>
            <Input
              id="seo-title"
              value={seo.title}
              onChange={(e) => setSeo((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Display title on tab bars & Google search results"
              className="rounded-none bg-white border-slate-300"
            />
            <span className="text-[10px] text-slate-400">Recommended length: 50-60 characters. Current length: {seo.title.length} chars</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seo-desc" className="text-xs font-bold uppercase tracking-wider text-slate-500">SEO Meta Description</Label>
            <textarea
              id="seo-desc"
              value={seo.description}
              onChange={(e) => setSeo((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Snippet explaining service context to potential clients on social media previews"
              className="w-full min-h-[70px] p-2.5 text-xs border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#c89a4b] rounded-none"
            />
            <span className="text-[10px] text-slate-400">Recommended length: 120-160 characters. Current length: {seo.description.length} chars</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seo-keywords" className="text-xs font-bold uppercase tracking-wider text-slate-500">Meta Keywords (Comma separated)</Label>
            <Input
              id="seo-keywords"
              value={seo.keywords}
              onChange={(e) => setSeo((prev) => ({ ...prev, keywords: e.target.value }))}
              placeholder="e.g., baking, bakery masterclass, sourdough, learn baking"
              className="rounded-none bg-white border-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Custom attributes workspace block */}
      <div className="bg-white p-6 border shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Layers size={18} className="text-[#c89a4b]" />
            <span>Dynamic Custom Attributes</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Register arbitrary key-value parameters. These details synchronize to the storefront API, allowing custom filtering and dynamic product tags.</p>
        </div>

        {/* List table */}
        <div className="border">
          <div className="grid grid-cols-3 bg-slate-50 font-bold border-b text-[10px] uppercase text-slate-600 tracking-wider p-2.5">
            <div>Attribute Key</div>
            <div>Value</div>
            <div className="text-right">Actions</div>
          </div>

          {customAttrs.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">No custom attributes registered. Click below to add.</div>
          ) : (
            customAttrs.map((attr, idx) => (
              <div key={attr.id} className="grid grid-cols-3 items-center p-2 border-b text-xs text-slate-700 font-mono">
                <div className="font-semibold text-slate-900">{attr.key}</div>
                <div>
                  <Input
                    value={attr.value}
                    onChange={(e) => {
                      const updated = [...customAttrs];
                      updated[idx].value = e.target.value;
                      setCustomAttrs(updated);
                    }}
                    className="h-7 text-xs rounded-none border-slate-300 font-sans"
                  />
                </div>
                <div className="text-right">
                  <Button
                    onClick={() => handleRemoveCustomAttr(attr.id)}
                    variant="ghost"
                    className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-none"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add block */}
        <div className="border p-4 bg-slate-50/50 space-y-3">
          <span className="text-xs font-bold text-slate-700">Add New Dynamic Parameter</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="attr-key" className="text-[10px] font-bold uppercase text-slate-500">Key Name (alphanumeric & underscore)</Label>
              <Input
                id="attr-key"
                placeholder="e.g., maximum_students_count"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                className="text-xs h-8 rounded-none bg-white border-slate-300 font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="attr-val" className="text-[10px] font-bold uppercase text-slate-500">Attribute Value</Label>
              <Input
                id="attr-val"
                placeholder="e.g., 20 people"
                value={newAttrValue}
                onChange={(e) => setNewAttrValue(e.target.value)}
                className="text-xs h-8 rounded-none bg-white border-slate-300"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomAttr();
                  }
                }}
              />
            </div>
          </div>
          <Button
            onClick={handleAddCustomAttr}
            variant="outline"
            className="h-8 rounded-none text-xs border-slate-300 hover:bg-slate-50 flex items-center gap-1 ml-auto"
          >
            <Plus size={13} />
            <span>Register Attribute</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
