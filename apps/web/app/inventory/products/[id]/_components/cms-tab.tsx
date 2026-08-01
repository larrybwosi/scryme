"use client";

import React, { RefObject } from "react";
import {
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Trash2,
  Upload,
  Loader2,
  X,
  Globe,
  Settings,
  Sun,
  Moon,
  Check,
  Calendar,
  ExternalLink,
  RefreshCw,
  Layers,
  Star,
  Plus,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/lib/utils";

interface CMSTabProps {
  product: any;
  categories: any[];
  markdown: string;
  setMarkdown: (v: string) => void;
  cmsImages: any[];
  setCmsImages: React.Dispatch<React.SetStateAction<any[]>>;
  newImageUrl: string;
  setNewImageUrl: (v: string) => void;
  newImageCaption: string;
  setNewImageCaption: (v: string) => void;
  seo: { title: string; description: string; keywords: string };
  setSeo: React.Dispatch<React.SetStateAction<{ title: string; description: string; keywords: string }>>;
  customAttrs: any[];
  setCustomAttrs: React.Dispatch<React.SetStateAction<any[]>>;
  newAttrKey: string;
  setNewAttrKey: (v: string) => void;
  newAttrValue: string;
  setNewAttrValue: (v: string) => void;
  publishStatus: string;
  setPublishStatus: (v: string) => void;
  publishedAt: string;
  setPublishedAt: (v: string) => void;
  archivedAt: string;
  setArchivedAt: (v: string) => void;
  layoutTemplate: string;
  setLayoutTemplate: (v: string) => void;
  customSlugOverride: string;
  setCustomSlugOverride: (v: string) => void;
  previewTheme: "light" | "dark";
  setPreviewTheme: (v: "light" | "dark") => void;
  storefrontMainImageIdx: number;
  setStorefrontMainImageIdx: (v: number) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  insertMarkdown: (syntax: string, placeholder?: string) => void;
  handleAddImage: () => void;
  handleRemoveImage: (id: string) => void;
  handleMoveImage: (index: number, direction: "up" | "down") => void;
  handleAddCustomAttr: () => void;
  handleRemoveCustomAttr: (id: string) => void;
}

export function CMSTab({
  product,
  categories,
  markdown,
  setMarkdown,
  cmsImages,
  setCmsImages,
  newImageUrl,
  setNewImageUrl,
  newImageCaption,
  setNewImageCaption,
  seo,
  setSeo,
  customAttrs,
  setCustomAttrs,
  newAttrKey,
  setNewAttrKey,
  newAttrValue,
  setNewAttrValue,
  publishStatus,
  setPublishStatus,
  publishedAt,
  setPublishedAt,
  archivedAt,
  setArchivedAt,
  layoutTemplate,
  setLayoutTemplate,
  customSlugOverride,
  setCustomSlugOverride,
  previewTheme,
  setPreviewTheme,
  storefrontMainImageIdx,
  setStorefrontMainImageIdx,
  textareaRef,
  isUploading,
  setIsUploading,
  fileInputRef,
  insertMarkdown,
  handleAddImage,
  handleRemoveImage,
  handleMoveImage,
  handleAddCustomAttr,
  handleRemoveCustomAttr,
}: CMSTabProps) {
  return (
    <div className="space-y-6 mt-0">
      <div className="bg-white dark:bg-zinc-950 p-6 border shadow-sm rounded-xl dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-foreground">Enterprise CMS Studio</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Manage high-fidelity storefront presentation, rich markdown guides, SEO target parameters, layouts, and scheduled publishing options.
        </p>
      </div>

      <Tabs defaultValue="rich-images" className="w-full">
        <div className="bg-background dark:bg-zinc-950 rounded-xl p-1 border shadow-sm mb-6 inline-flex dark:border-zinc-800">
          <TabsList className="bg-transparent border-none p-0 h-auto gap-1">
            <TabsTrigger
              value="rich-images"
              className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900"
            >
              <Sparkles className="w-4 h-4" />
              <span>Rich Content & Gallery</span>
            </TabsTrigger>
            <TabsTrigger
              value="seo-layout"
              className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900"
            >
              <Globe className="w-4 h-4" />
              <span>SEO & Theme Settings</span>
            </TabsTrigger>
            <TabsTrigger
              value="publishing"
              className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900"
            >
              <Settings className="w-4 h-4" />
              <span>Publishing & Attributes</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* SUB-TAB 1: Rich Description & Images */}
        <TabsContent value="rich-images" className="space-y-6 mt-0">
          {/* Image Manager Section */}
          <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <ImageIcon size={18} className="text-amber-500" />
                <span>Showcase Gallery (Unified Images)</span>
              </CardTitle>
              <CardDescription>
                Reorder gallery items, define captions/alt text, and manage direct image links. Keep standard assets fully unified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Grid list of current images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 bg-muted/30 rounded-lg dark:border-zinc-800">
                {cmsImages.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-muted-foreground italic">
                    No images added yet. Storefront will use fallback placeholders.
                  </div>
                ) : (
                  cmsImages.map((img, idx) => (
                    <div key={img.id} className="bg-background border p-3 flex flex-col gap-2 relative shadow-xs rounded-lg dark:border-zinc-800">
                      <div className="aspect-video w-full bg-muted overflow-hidden relative rounded-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.caption || "Product Image"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-zinc-900/90 px-2 py-0.5 text-[10px] font-mono text-white tracking-widest font-bold rounded">
                          #{idx + 1} {idx === 0 && "(MAIN)"}
                        </div>
                      </div>

                      {/* Caption input */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Caption / Alternative Text</Label>
                        <Input
                          value={img.caption}
                          onChange={(e) => {
                            const updated = [...cmsImages];
                            updated[idx].caption = e.target.value;
                            setCmsImages(updated);
                          }}
                          className="text-xs h-7 rounded border-border"
                          placeholder="e.g. Ergonomic sole close up"
                        />
                      </div>

                      {/* Reordering and removal controls */}
                      <div className="flex items-center justify-between border-t pt-2 mt-1 dark:border-zinc-800">
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => handleMoveImage(idx, "up")}
                            disabled={idx === 0}
                            variant="outline"
                            className="h-6 w-6 p-0 rounded border-border bg-background"
                            title="Move main image forward"
                            aria-label="Move main image forward"
                          >
                            <ChevronUp size={12} />
                          </Button>
                          <Button
                            onClick={() => handleMoveImage(idx, "down")}
                            disabled={idx === cmsImages.length - 1}
                            variant="outline"
                            className="h-6 w-6 p-0 rounded border-border bg-background"
                            title="Move back"
                            aria-label="Move back"
                          >
                            <ChevronDown size={12} />
                          </Button>
                        </div>

                        <Button
                          onClick={() => handleRemoveImage(img.id)}
                          variant="ghost"
                          className="h-6 px-2 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-xs rounded"
                          title="Remove image"
                          aria-label="Remove image"
                        >
                          <Trash2 size={12} className="mr-1 inline" />
                          <span>Remove</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add new image form */}
              <div className="border p-4 bg-muted/10 space-y-3 rounded-lg dark:border-zinc-800">
                <span className="text-xs font-bold text-foreground">Add New Showcase Image</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Upload Image</Label>
                    <div
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      className="relative border-2 border-dashed border-border dark:border-zinc-800 bg-background p-4 text-center rounded-lg hover:border-muted-foreground/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[90px]"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                          <span className="text-[10px] text-muted-foreground font-semibold">Uploading to storage...</span>
                        </div>
                      ) : newImageUrl ? (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={newImageUrl} className="h-10 w-10 object-cover rounded" alt="Upload preview" />
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">Uploaded successfully</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-muted rounded text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewImageUrl("");
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground font-semibold">Click or Drag to Upload</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            const res = await fetch("/api/upload", {
                              method: "POST",
                              body: formData,
                            });
                            if (!res.ok) throw new Error("Upload failed");
                            const resData = await res.json();
                            const url = resData.data?.url || resData.url;
                            if (!url) throw new Error("No URL returned");
                            setNewImageUrl(url);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-img-caption" className="text-[10px] font-bold uppercase text-muted-foreground">Caption / Alt text</Label>
                    <Input
                      id="new-img-caption"
                      placeholder="e.g. Back view of the product"
                      value={newImageCaption}
                      onChange={(e) => setNewImageCaption(e.target.value)}
                      className="text-xs h-8 rounded bg-background border-border"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddImage();
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddImage}
                    variant="outline"
                    className="h-8 rounded text-xs border-border hover:bg-muted flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Insert Image</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Split-pane Markdown Editor */}
          <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Sparkles size={18} className="text-amber-500" />
                <span>Storefront Rich Content Composer</span>
              </CardTitle>
              <CardDescription>
                Compose detailed Markdown stories, manuals, or guides that render as high-fidelity HTML on public listings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formatting Helper Tools */}
              <div className="flex items-center gap-1.5 flex-wrap bg-muted/60 p-2 border border-border rounded-lg dark:border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => insertMarkdown("bold", "bold text")}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-7 px-2 text-xs font-bold hover:bg-muted rounded text-foreground"
                  title="Bold (**text**)"
                  aria-label="Bold (**text**)"
                >
                  <Bold size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => insertMarkdown("italic", "italic text")}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                  title="Italic (*text*)"
                  aria-label="Italic (*text*)"
                >
                  <Italic size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => insertMarkdown("h1", "Heading 1")}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-7 px-2 text-xs font-bold hover:bg-muted rounded text-foreground"
                  title="H1 heading (# Heading)"
                  aria-label="H1 heading (# Heading)"
                >
                  <Heading1 size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => insertMarkdown("h2", "Heading 2")}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-7 px-2 text-xs font-bold hover:bg-muted rounded text-foreground"
                  title="H2 heading (## Heading)"
                  aria-label="H2 heading (## Heading)"
                >
                  <Heading2 size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => insertMarkdown("quote", "blockquote citation")}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                  title="Blockquote (> citation)"
                  aria-label="Blockquote (> citation)"
                >
                  <Quote size={13} />
                </Button>
                <span className="h-4 w-[1px] bg-border mx-1" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => insertMarkdown("bullet", "list item")}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                  title="Bullet List (- item)"
                  aria-label="Bullet List (- item)"
                >
                  <List size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => insertMarkdown("ordered", "list item")}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                  title="Numbered List (1. item)"
                  aria-label="Numbered List (1. item)"
                >
                  <ListOrdered size={13} />
                </Button>
                <span className="h-4 w-[1px] bg-border mx-1" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => insertMarkdown("link", "Link Title")}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                  title="Hyperlink ([title](url))"
                  aria-label="Hyperlink ([title](url))"
                >
                  <Link2 size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => insertMarkdown("image", "Image alt caption")}
                  onMouseDown={(e) => e.preventDefault()}
                  className="h-7 px-2 text-xs hover:bg-muted rounded text-foreground"
                  title="Image ([caption](url))"
                  aria-label="Image ([caption](url))"
                >
                  <ImageIcon size={13} />
                </Button>
              </div>

              {/* Text editor and preview side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Editor */}
                <div className="space-y-1.5 flex flex-col">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Markdown Composer</Label>
                  <textarea
                    ref={textareaRef}
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    placeholder="# Product Overview..."
                    className="w-full flex-1 min-h-[300px] p-3 text-xs font-mono border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y rounded-lg dark:border-zinc-800"
                  />
                </div>

                {/* Live parsing HTML render preview */}
                <div className="flex flex-col">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Live Formatted Output Preview</Label>
                  <div className="w-full flex-1 min-h-[300px] p-4 border border-border bg-muted/10 overflow-y-auto rounded-lg dark:border-zinc-800 max-h-[420px]">
                    {markdown ? (
                      <div
                        className="prose prose-sm max-w-none text-foreground break-words dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(markdown) }}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No description composed. HTML preview is empty.</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUB-TAB 2: SEO & Layout Options */}
        <TabsContent value="seo-layout" className="space-y-6 mt-0">
          <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Globe size={18} className="text-amber-500" />
                <span>Search Engine Optimization (SEO) Metadata</span>
              </CardTitle>
              <CardDescription>
                Define fields to configure browser tab metadata, search crawler descriptions, and social media sharing previews.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="seo-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SEO Meta Title</Label>
                <Input
                  id="seo-title"
                  value={seo.title}
                  onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                  placeholder="Tab Title & Search Engines Headline"
                  className="rounded bg-background border-border"
                />
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>Recommended: 50-60 characters.</span>
                  <span className={seo.title.length > 60 ? "text-amber-500 font-semibold" : "text-green-500"}>
                    Current: {seo.title.length} chars
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seo-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SEO Meta Description</Label>
                <Textarea
                  id="seo-desc"
                  value={seo.description}
                  onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                  placeholder="Short summary paragraph displayed beneath the heading on Google results"
                  className="min-h-20 rounded bg-background border-border"
                />
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>Recommended: 120-160 characters.</span>
                  <span className={seo.description.length > 160 ? "text-amber-500 font-semibold" : "text-green-500"}>
                    Current: {seo.description.length} chars
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seo-keywords" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta Keywords (Comma separated)</Label>
                <Input
                  id="seo-keywords"
                  value={seo.keywords}
                  onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                  placeholder="e.g. sports shoes, lightweight boots, athletic gear"
                  className="rounded bg-background border-border"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Settings size={18} className="text-amber-500" />
                <span>E-commerce Layout & Preview Themes</span>
              </CardTitle>
              <CardDescription>
                Customize page template designs and modify storefront live previews instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="cms-template" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Layout Style</Label>
                <Select
                  value={layoutTemplate}
                  onValueChange={setLayoutTemplate}
                >
                  <SelectTrigger id="cms-template" className="rounded bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="Default Grid">Default Grid Showcase</SelectItem>
                    <SelectItem value="Elegant Editorial">Elegant Editorial Profile</SelectItem>
                    <SelectItem value="Minimalist Modern">Minimalist Modern Single-Focus</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground">Dictates the page structures on client-facing storefronts.</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview Theme Toggle</Label>
                <div className="flex items-center gap-3 border p-2 bg-muted/20 rounded-lg dark:border-zinc-800 h-9">
                  <button
                    type="button"
                    onClick={() => setPreviewTheme("light")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1 text-xs rounded transition-all font-semibold",
                      previewTheme === "light" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sun size={13} />
                    <span>Light mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTheme("dark")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1 text-xs rounded transition-all font-semibold",
                      previewTheme === "dark" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Moon size={13} />
                    <span>Dark mode</span>
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground">Toggle colors inside the simulated live preview card.</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUB-TAB 3: Publishing & Advanced Settings */}
        <TabsContent value="publishing" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status selection */}
            <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <CheckCircle2 size={18} className="text-amber-500" />
                  <span>Publishing Status</span>
                </CardTitle>
                <CardDescription>Configure storefront listings status parameters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <Label htmlFor="cms-status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Listing Status</Label>
                <Select
                  value={publishStatus}
                  onValueChange={setPublishStatus}
                >
                  <SelectTrigger id="cms-status" className="rounded bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="Draft">Draft (Internal Only)</SelectItem>
                    <SelectItem value="Published">Published (Publicly Searchable)</SelectItem>
                    <SelectItem value="Scheduled">Scheduled (Auto live / Archive)</SelectItem>
                    <SelectItem value="Archived">Archived (De-listed)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground">Draft mode prevents checkout access in active shopping carts.</span>
              </CardContent>
            </Card>

            {/* Schedule times */}
            <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Calendar size={18} className="text-amber-500" />
                  <span>Publication Schedule</span>
                </CardTitle>
                <CardDescription>Optional automatic publishing timelines.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="published-at" className="text-[10px] font-bold uppercase text-muted-foreground">Scheduled Live</Label>
                  <input
                    id="published-at"
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full text-xs p-2 border border-border rounded bg-background text-foreground dark:border-zinc-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="archived-at" className="text-[10px] font-bold uppercase text-muted-foreground">Scheduled Archive</Label>
                  <input
                    id="archived-at"
                    type="datetime-local"
                    value={archivedAt}
                    onChange={(e) => setArchivedAt(e.target.value)}
                    className="w-full text-xs p-2 border border-border rounded bg-background text-foreground dark:border-zinc-800 focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Slug Override */}
          <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <ExternalLink size={18} className="text-amber-500" />
                <span>SEO Customized URL Override</span>
              </CardTitle>
              <CardDescription>Overwrites default products slug path to yield highly optimized clean marketing URLs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cms-slug-override" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Marketing Slug Override</Label>
                <div className="flex gap-2">
                  <Input
                    id="cms-slug-override"
                    value={customSlugOverride}
                    onChange={(e) => setCustomSlugOverride(e.target.value)}
                    className="rounded bg-background border-border"
                    placeholder="e.g. premium-sneakers-seasonal-deal"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setCustomSlugOverride(product.slug || "")}
                    title="Reset to default slug"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Output path: https://scryme.store/products/{customSlugOverride || product.slug || "unnamed"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Custom Metadata attributes */}
          <Card className="border-border shadow-sm ring-1 ring-border dark:ring-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Layers size={18} className="text-amber-500" />
                <span>Dynamic Product Metadata Parameters</span>
              </CardTitle>
              <CardDescription>Configure custom tag properties filterable inside search indices and shopping catalog selectors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Grid attributes table */}
              <div className="border rounded-lg overflow-hidden dark:border-zinc-800">
                <div className="grid grid-cols-3 bg-muted/60 font-bold border-b text-[10px] uppercase text-muted-foreground tracking-wider p-2.5 dark:border-zinc-800">
                  <div>Parameter Key</div>
                  <div>Value Settings</div>
                  <div className="text-right">Remove</div>
                </div>

                {customAttrs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground italic">No parameters registered. Use inputs below.</div>
                ) : (
                  customAttrs.map((attr: any, idx: number) => (
                    <div key={attr.id} className="grid grid-cols-3 items-center p-2 border-b text-xs text-foreground font-mono dark:border-zinc-800">
                      <div className="font-semibold text-foreground pl-1">{attr.key}</div>
                      <div>
                        <Input
                          value={attr.value}
                          onChange={(e) => {
                            const updated = [...customAttrs];
                            updated[idx].value = e.target.value;
                            setCustomAttrs(updated);
                          }}
                          className="h-7 text-xs rounded border-border bg-background font-sans"
                        />
                      </div>
                      <div className="text-right pr-1">
                        <Button
                          onClick={() => handleRemoveCustomAttr(attr.id)}
                          variant="ghost"
                          className="h-7 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add attribute forms */}
              <div className="border p-4 bg-muted/10 space-y-3 rounded-lg dark:border-zinc-800">
                <span className="text-xs font-bold text-foreground">Add Custom Parameter</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="attr-key" className="text-[10px] font-bold uppercase text-muted-foreground font-mono">Key Name (alphanumeric & underscore)</Label>
                    <Input
                      id="attr-key"
                      placeholder="e.g. fabric_rating"
                      value={newAttrKey}
                      onChange={(e) => setNewAttrKey(e.target.value)}
                      className="text-xs h-8 rounded bg-background border-border font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="attr-val" className="text-[10px] font-bold uppercase text-muted-foreground">Value Content</Label>
                    <Input
                      id="attr-val"
                      placeholder="e.g. Waterproof Gore-Tex"
                      value={newAttrValue}
                      onChange={(e) => setNewAttrValue(e.target.value)}
                      className="text-xs h-8 rounded bg-background border-border"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomAttr();
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddCustomAttr}
                    variant="outline"
                    className="h-8 rounded text-xs border-border hover:bg-muted flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Attribute</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// CheckCircle2 component
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-check-circle-2", props.className)}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// Inline Markdown Parser to render HTML
function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold mt-3 mb-1.5 text-inherit font-sans">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold mt-4 mb-2 text-inherit font-sans">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-extrabold mt-5 mb-2.5 text-inherit font-sans">$1</h1>');

  // Blockquotes
  html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote class="border-l-4 border-amber-500 pl-3 italic my-3 text-muted-foreground">$1</blockquote>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-inherit">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-inherit">$1</strong>');

  // Italics
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-inherit">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="italic text-inherit">$1</em>');

  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code class="bg-muted text-amber-500 px-1 py-0.5 rounded font-mono text-xs border">$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-500 font-medium underline hover:text-amber-600">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded my-3 border shadow-sm inline-block" />');

  const lines = html.split("\n");
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.substring(2);
      if (!inList) {
        lines[i] = '<ul class="list-disc pl-4 my-1.5 space-y-0.5 text-inherit text-xs">\n<li>' + content + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else if (/^\d+\.\s+/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, "");
      if (!inOrderedList) {
        lines[i] = '<ol class="list-decimal pl-4 my-1.5 space-y-0.5 text-inherit text-xs">\n<li>' + content + '</li>';
        inOrderedList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else {
      if (inList) {
        lines[i] = '</ul>\n' + lines[i];
        inList = false;
      }
      if (inOrderedList) {
        lines[i] = '</ol>\n' + lines[i];
        inOrderedList = false;
      }
      if (
        lines[i].trim() &&
        !lines[i].trim().startsWith("<h") &&
        !lines[i].trim().startsWith("<blockquote") &&
        !lines[i].trim().startsWith("<ul") &&
        !lines[i].trim().startsWith("<ol") &&
        !lines[i].trim().startsWith("<li")
      ) {
        lines[i] = '<p class="my-1.5 leading-relaxed text-inherit text-xs">' + lines[i] + '</p>';
      }
    }
  }

  if (inList) lines.push("</ul>");
  if (inOrderedList) lines.push("</ol>");

  return lines.join("\n");
}
