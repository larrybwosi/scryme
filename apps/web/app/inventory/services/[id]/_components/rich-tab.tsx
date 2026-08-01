"use client";

import React, { RefObject } from "react";
import {
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Trash2,
  Upload,
  Loader2,
  X,
  Plus,
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Link2,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { toast } from "sonner";

interface ImageItem {
  id: string;
  url: string;
  caption: string;
}

interface RichTabProps {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  newImageUrl: string;
  setNewImageUrl: (v: string) => void;
  newImageCaption: string;
  setNewImageCaption: (v: string) => void;
  markdown: string;
  setMarkdown: (v: string) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleAddImage: () => void;
  handleRemoveImage: (id: string) => void;
  handleMoveImage: (index: number, direction: "up" | "down") => void;
  insertMarkdown: (syntax: string, placeholder?: string) => void;
}

export function RichTab({
  images,
  setImages,
  newImageUrl,
  setNewImageUrl,
  newImageCaption,
  setNewImageCaption,
  markdown,
  setMarkdown,
  isUploading,
  setIsUploading,
  textareaRef,
  fileInputRef,
  handleAddImage,
  handleRemoveImage,
  handleMoveImage,
  insertMarkdown,
}: RichTabProps) {
  return (
    <div className="space-y-6">
      {/* Image Manager Section */}
      <div className="bg-white p-6 border shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <ImageIcon size={18} className="text-[#c89a4b]" />
            <span>Multiple Storefront Images</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage the gallery showcasing this service in storefront listings and booking portals.</p>
        </div>

        {/* Grid list of current images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 bg-slate-50">
          {images.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 italic">
              No images added yet. Storefronts will use standard placeholders.
            </div>
          ) : (
            images.map((img, idx) => (
              <div key={img.id} className="bg-white border p-3 flex flex-col gap-2 relative shadow-xs">
                <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption || "Service Image"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-white tracking-widest font-bold">
                    #{idx + 1} {idx === 0 && "(MAIN)"}
                  </div>
                </div>

                {/* Caption input */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Caption / Alternative Text</Label>
                  <Input
                    value={img.caption}
                    onChange={(e) => {
                      const updated = [...images];
                      updated[idx].caption = e.target.value;
                      setImages(updated);
                    }}
                    className="text-xs h-7 rounded-none border-slate-300"
                    placeholder="e.g., Bread dough proofing room"
                  />
                </div>

                {/* Reordering and removal controls */}
                <div className="flex items-center justify-between border-t pt-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleMoveImage(idx, "up")}
                      disabled={idx === 0}
                      variant="outline"
                      className="h-6 w-6 p-0 rounded-none border-slate-300 bg-white"
                      title="Move main image forward"
                      aria-label="Move main image forward"
                    >
                      <ChevronUp size={12} />
                    </Button>
                    <Button
                      onClick={() => handleMoveImage(idx, "down")}
                      disabled={idx === images.length - 1}
                      variant="outline"
                      className="h-6 w-6 p-0 rounded-none border-slate-300 bg-white"
                      title="Move back"
                      aria-label="Move back"
                    >
                      <ChevronDown size={12} />
                    </Button>
                  </div>

                  <Button
                    onClick={() => handleRemoveImage(img.id)}
                    variant="ghost"
                    className="h-6 px-2 hover:bg-red-50 text-red-600 text-xs rounded-none"
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
        <div className="border p-4 bg-slate-50/50 space-y-3">
          <span className="text-xs font-bold text-slate-700">Add New Showcase Image</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Upload Image</Label>
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-slate-300 bg-white p-4 text-center rounded-none hover:border-slate-400 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[90px]"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                    <span className="text-[10px] text-slate-500 font-semibold">Uploading to storage...</span>
                  </div>
                ) : newImageUrl ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={newImageUrl} className="h-10 w-10 object-cover" alt="Upload preview" />
                      <span className="text-[10px] text-emerald-600 font-bold truncate">Uploaded successfully</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-slate-100 rounded-none text-slate-500"
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
                    <Upload className="h-5 w-5 text-slate-400 mb-1" />
                    <span className="text-[10px] text-slate-500 font-semibold">Click or Drag to Upload</span>
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
                      toast.success("Image uploaded successfully!");
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to upload image");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-img-caption" className="text-[10px] font-bold uppercase text-slate-500">Caption</Label>
              <Input
                id="new-img-caption"
                placeholder="e.g., Freshly baked croissants details"
                value={newImageCaption}
                onChange={(e) => setNewImageCaption(e.target.value)}
                className="text-xs h-8 rounded-none bg-white border-slate-300"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
              />
            </div>
          </div>
          <Button
            onClick={handleAddImage}
            variant="outline"
            className="h-8 rounded-none text-xs border-slate-300 hover:bg-slate-50 flex items-center gap-1 ml-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Insert Image</span>
          </Button>
        </div>
      </div>

      {/* Split-pane Markdown Editor */}
      <div className="bg-white p-6 border shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles size={18} className="text-[#c89a4b]" />
            <span>Storefront Rich Content Description</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Write detailed markdown content to display beautiful informational guides about this service.</p>
        </div>

        {/* Formatting Tools Helper Bar */}
        <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 p-1.5 border border-slate-300">
          <Button
            type="button"
            variant="ghost"
            onClick={() => insertMarkdown("bold", "bold text")}
            onMouseDown={(e) => e.preventDefault()}
            className="h-7 px-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-none"
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
            className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
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
            className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none font-bold"
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
            className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none font-bold"
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
            className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
            title="Blockquote (> citation)"
            aria-label="Blockquote (> citation)"
          >
            <Quote size={13} />
          </Button>
          <span className="h-4 w-[1px] bg-slate-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            onClick={() => insertMarkdown("bullet", "list item")}
            onMouseDown={(e) => e.preventDefault()}
            className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
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
            className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
            title="Numbered List (1. item)"
            aria-label="Numbered List (1. item)"
          >
            <ListOrdered size={13} />
          </Button>
          <span className="h-4 w-[1px] bg-slate-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            onClick={() => insertMarkdown("link", "Link Title")}
            onMouseDown={(e) => e.preventDefault()}
            className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
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
            className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200 rounded-none"
            title="Image ([caption](url))"
            aria-label="Image ([caption](url))"
          >
            <ImageIcon size={13} />
          </Button>
        </div>

        {/* Editor Split-Pane */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Raw text editor */}
          <div className="space-y-1.5 flex flex-col">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Markdown Composer</Label>
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="# Service Overview..."
              className="w-full flex-1 min-h-[300px] md:min-h-[420px] p-3 text-xs font-mono border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#c89a4b] resize-y rounded-none"
            />
          </div>

          {/* Right: Rich parsed rendering preview */}
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Live Formatted Render Preview</Label>
            <div className="w-full flex-1 min-h-[300px] md:min-h-[420px] p-4 border border-slate-300 bg-slate-50 overflow-y-auto rounded-none">
              {markdown ? (
                <div
                  className="prose prose-sm max-w-none text-slate-800 break-words"
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(markdown) }}
                />
              ) : (
                <span className="text-xs text-slate-400 italic">No content written. HTML render preview is empty.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Markdown Parser to render HTML (duplicated for self-containment)
function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-4 mb-2 text-slate-800 font-sans">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-5 mb-2.5 text-slate-900 font-sans">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold mt-6 mb-3 text-slate-900 font-sans">$1</h1>');

  // Blockquotes
  html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote class="border-l-4 border-amber-500 pl-4 italic my-4 text-slate-600 bg-slate-50 py-1.5 pr-2 rounded-none">$1</blockquote>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-slate-950">$1</strong>');

  // Italics
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="italic text-slate-800">$1</em>');

  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-amber-700 px-1.5 py-0.5 rounded-none font-mono text-xs border">$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-600 font-medium underline hover:text-amber-800">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-none my-4 border shadow-sm inline-block" />');

  const lines = html.split("\n");
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.substring(2);
      if (!inList) {
        lines[i] = '<ul class="list-disc pl-5 my-2 space-y-1 text-slate-700 text-sm">\n<li>' + content + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else if (/^\d+\.\s+/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, "");
      if (!inOrderedList) {
        lines[i] = '<ol class="list-decimal pl-5 my-2 space-y-1 text-slate-700 text-sm">\n<li>' + content + '</li>';
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
        lines[i] = '<p class="my-2.5 leading-relaxed text-slate-700 text-sm">' + lines[i] + '</p>';
      }
    }
  }

  if (inList) lines.push("</ul>");
  if (inOrderedList) lines.push("</ol>");

  return lines.join("\n");
}
