import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Copy,
  Check,
  Terminal,
  ChevronRight,
  ChevronDown,
  Globe,
  BookOpen,
  Code,
  Lock,
  Menu,
  X,
  FileText,
  Workflow,
  Shield,
  Layers,
  Fingerprint,
  RefreshCw,
} from "lucide-react";
import openapiSpec from "./openapi.json";

// --- Design Tokens (Scryme) ---
const colors = {
  inkBg: "#0B1220",
  inkCard: "#111A2E",
  inkBorder: "#1E293B",
  brass: "#C89A4B",
  paper: "#F1E9D8",
  lightText: "#94A3B8",
};

// --- Type Definitions for parsed schema ---
interface Endpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  operationId: string;
  parameters: any[];
  requestBody: any;
  responses: any;
  security: any[];
  tag: string;
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [activeEndpointId, setActiveEndpointId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "node" | "python">("curl");
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // CMS Guide Pinned Navigation State
  const [selectedCmsTarget, setSelectedCmsTarget] = useState<"service" | "product">("service");

  // Parse OpenAPI JSON Spec dynamically
  const endpoints = useMemo(() => {
    const list: Endpoint[] = [];
    const paths = openapiSpec.paths as Record<string, any>;
    if (!paths) return [];

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      for (const [methodKey, methodObj] of Object.entries(pathObj)) {
        if (methodKey === "parameters") continue; // skip path-level params

        const tags = methodObj.tags || ["General"];
        const primaryTag = tags[0];

        list.push({
          path: pathKey,
          method: methodKey.toUpperCase(),
          summary: methodObj.summary || "",
          description: methodObj.description || "",
          operationId: methodObj.operationId || `${methodKey}_${pathKey}`,
          parameters: methodObj.parameters || [],
          requestBody: methodObj.requestBody || null,
          responses: methodObj.responses || {},
          security: methodObj.security || [],
          tag: primaryTag,
        });
      }
    }
    return list;
  }, []);

  // Unique Tags grouped beautifully
  const tagGroups = useMemo(() => {
    const groups: Record<string, Endpoint[]> = {};
    endpoints.forEach((ep) => {
      if (!groups[ep.tag]) {
        groups[ep.tag] = [];
      }
      groups[ep.tag].push(ep);
    });
    return groups;
  }, [endpoints]);

  // Set default state once specs are parsed
  useEffect(() => {
    const tags = Object.keys(tagGroups);
    if (tags.length > 0) {
      setSelectedTag(tags[0]);
      setExpandedGroups(
        tags.reduce((acc, t) => ({ ...acc, [t]: true }), {})
      );
      // Initialize with CMS customization guide to show it off first, or fall back to first endpoint if needed
      setActiveEndpointId("cms-customization-guide");
    }
  }, [tagGroups]);

  // Filtered endpoints based on Search Query
  const filteredTagGroups = useMemo(() => {
    if (!searchQuery) return tagGroups;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Endpoint[]> = {};

    for (const [tag, eps] of Object.entries(tagGroups)) {
      const matched = eps.filter(
        (ep) =>
          ep.path.toLowerCase().includes(query) ||
          ep.summary.toLowerCase().includes(query) ||
          ep.description.toLowerCase().includes(query) ||
          ep.method.toLowerCase().includes(query)
      );
      if (matched.length > 0) {
        filtered[tag] = matched;
      }
    }
    return filtered;
  }, [tagGroups, searchQuery]);

  // Show guide in search list if matched
  const showGuideInSearch = useMemo(() => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      "cms customization guide".includes(query) ||
      "customfields".includes(query) ||
      "markdown".includes(query) ||
      "seo metadata".includes(query) ||
      "image gallery".includes(query) ||
      "customattributes".includes(query)
    );
  }, [searchQuery]);

  const activeEndpoint = useMemo(() => {
    return endpoints.find((ep) => ep.operationId === activeEndpointId) || endpoints[0];
  }, [endpoints, activeEndpointId]);

  // JSON Schema Ref Resolver Helper with cycle detection and depth limit
  const resolveSchema = (schema: any, visited = new Set<string>(), depth = 0): any => {
    if (!schema || depth > 8) return null;
    if (schema.$ref) {
      const refName = schema.$ref.split("/").pop();
      if (refName) {
        if (visited.has(refName)) {
          // Prevent circular reference infinite loops
          return { type: "object", description: `Circular reference to ${refName}` };
        }
        const resolved = (openapiSpec.components as any)?.schemas?.[refName];
        if (resolved) {
          const nextVisited = new Set(visited);
          nextVisited.add(refName);
          return resolveSchema(resolved, nextVisited, depth + 1);
        }
      }
    }
    if (schema.type === "object" && schema.properties) {
      const resolvedProperties: any = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        resolvedProperties[key] = resolveSchema(value, visited, depth + 1);
      }
      return { ...schema, properties: resolvedProperties };
    }
    if (schema.type === "array" && schema.items) {
      return { ...schema, items: resolveSchema(schema.items, visited, depth + 1) };
    }
    return schema;
  };

  // Mock JSON payload builder with recursion limit and cycle detection
  const generateMockFromSchema = (schema: any, depth = 0, visitedRefs = new Set<string>()): any => {
    if (!schema || depth > 8) return null;

    // If it has a $ref, resolve it first to generate appropriate sub-structure
    if (schema.$ref) {
      const refName = schema.$ref.split("/").pop();
      if (refName) {
        if (visitedRefs.has(refName)) {
          return {}; // stop cyclic expansion
        }
        const resolved = (openapiSpec.components as any)?.schemas?.[refName];
        if (resolved) {
          const nextVisited = new Set(visitedRefs);
          nextVisited.add(refName);
          return generateMockFromSchema(resolved, depth + 1, nextVisited);
        }
      }
    }

    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;

    if (schema.type === "object") {
      const obj: any = {};
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          obj[key] = generateMockFromSchema(prop, depth + 1, visitedRefs);
        }
      }
      return obj;
    }
    if (schema.type === "array") {
      const childMock = generateMockFromSchema(schema.items, depth + 1, visitedRefs);
      return childMock ? [childMock] : [];
    }
    if (schema.type === "string") {
      if (schema.format === "date-time") return new Date().toISOString();
      if (schema.format === "email") return "developer@scryme.tech";
      if (schema.enum && schema.enum.length > 0) return schema.enum[0];
      return "string_value";
    }
    if (schema.type === "number" || schema.type === "integer") {
      return 100;
    }
    if (schema.type === "boolean") {
      return true;
    }
    return {};
  };

  // Extract schema definitions for request body
  const requestBodySchema = useMemo(() => {
    if (!activeEndpoint || !activeEndpoint.requestBody) return null;
    const content = activeEndpoint.requestBody.content;
    const jsonContent = content?.["application/json"];
    return jsonContent?.schema ? resolveSchema(jsonContent.schema) : null;
  }, [activeEndpoint]);

  // Extract Mock Request payload
  const mockRequestPayload = useMemo(() => {
    if (!activeEndpoint || !activeEndpoint.requestBody) return null;
    const content = activeEndpoint.requestBody.content;
    const jsonContent = content?.["application/json"];
    return jsonContent?.schema ? generateMockFromSchema(jsonContent.schema) : null;
  }, [activeEndpoint]);

  // Extract Mock Response payload
  const mockResponsePayload = useMemo(() => {
    if (!activeEndpoint) return null;
    const successResponse = activeEndpoint.responses?.["200"] || activeEndpoint.responses?.["201"];
    if (!successResponse) return { success: true };
    const content = successResponse.content;
    const jsonContent = content?.["application/json"];
    return jsonContent?.schema ? generateMockFromSchema(jsonContent.schema) : { success: true };
  }, [activeEndpoint]);

  // Generate dynamic URL with path variables highlighted
  const getDynamicUrl = (path: string) => {
    return path.replace(/{([^}]+)}/g, ":$1");
  };

  // Generate dynamic Code Snippets
  const codeSnippets = useMemo(() => {
    if (activeEndpointId === "cms-customization-guide") {
      const baseUrl = "https://api.scryme.tech/v3";

      const servicePayload = {
        name: "Artisan Sourdough Masterclass",
        sku: "SRV-BKA-001",
        price: 120.00,
        customFields: {
          markdownDescription: "# Sourdough Masterclass 🌾\nLearn fermentation secrets from our master bakers.\n\n### Outline\n- Wild yeast starter cultivation\n- High-hydration mixing\n- Bulk proofing & scoring",
          images: [
            {
              id: "img_srv_cover",
              url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
              caption: "Baker scoring proofed sourdough loaf"
            }
          ],
          seo: {
            title: "Artisan Sourdough Masterclass | Scryme Bakery",
            description: "Learn organic sourdough artisan baking techniques in a 4-hour hands-on class.",
            keywords: "baking masterclass, sourdough baking"
          },
          customAttributes: {
            maximum_participants: "12 students",
            skill_level: "Intermediate"
          }
        }
      };

      const productPayload = {
        name: "Premium Round Proofing Banneton",
        sku: "PROD-BKA-BANN-02",
        price: 24.99,
        customFields: {
          markdownDescription: "# Round Cane Proofing Banneton 🧺\nHand-crafted from 100% natural organic Indonesian rattan cane.\n\n## Features\n- Draws moisture away for crisper crust\n- Flour leaves beautiful spiral designs",
          images: [
            {
              id: "img_bann_cover",
              url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
              caption: "Organic rattan cane banneton baskets"
            }
          ],
          seo: {
            title: "Premium Indonesian Cane Banneton | Scryme Shop",
            description: "Buy premium Indonesian cane rattan proofing banneton baskets with linen liners.",
            keywords: "proofing basket, banneton"
          },
          customAttributes: {
            material: "100% Cane Rattan",
            origin: "Hand-woven in Indonesia"
          },
          publishStatus: "Published",
          publishedAt: new Date().toISOString(),
          layoutTemplate: "eCommerce Grid",
          customSlugOverride: "premium-rattan-proofing-banneton"
        }
      };

      const targetPayload = selectedCmsTarget === "service" ? servicePayload : productPayload;
      const targetUrl = selectedCmsTarget === "service"
        ? `${baseUrl}/bakery-co/services/srv_sourdough_101`
        : `${baseUrl}/bakery-co/catalog/products/prod_proofing_basket`;
      const targetMethod = "PATCH";

      const bodyStr = JSON.stringify(targetPayload, null, 2);

      // cURL
      let curl = `curl -X ${targetMethod} "${targetUrl}" \\\n  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyStr.replace(/'/g, "'\\''")}'`;

      // Node
      let node = `// Node.js Fetch Code\nconst url = "${targetUrl}";\nconst options = {\n  method: "${targetMethod}",\n  headers: {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${JSON.stringify(targetPayload, null, 2)})\n};\n\ntry {\n  const response = await fetch(url, options);\n  const data = await response.json();\n  console.log(data);\n} catch (error) {\n  console.error("Error:", error);\n}`;

      // Python
      let python = `import requests\n\nurl = "${targetUrl}"\nheaders = {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n}\npayload = ${JSON.stringify(targetPayload, null, 4).replace(/true/g, "True").replace(/false/g, "False").replace(/null/g, "None")}\n\nresponse = requests.patch(url, json=payload, headers=headers)\nprint(response.json())`;

      return { curl, node, python };
    }

    if (!activeEndpoint) return { curl: "", node: "", python: "" };

    const baseUrl = "https://api.scryme.tech";
    const path = activeEndpoint.path;
    const method = activeEndpoint.method;
    const fullUrl = `${baseUrl}${path}`;

    // Compile dynamic payload string
    const bodyStr = mockRequestPayload ? JSON.stringify(mockRequestPayload, null, 2) : "";

    // cURL Snippet
    let curl = `curl -X ${method} "${fullUrl}" \\\n  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json"`;
    if (bodyStr) {
      curl += ` \\\n  -d '${bodyStr.replace(/'/g, "'\\''")}'`;
    }

    // Node Fetch Snippet
    let node = `// Node.js Fetch Code\n`;
    node += `const url = "${fullUrl}";\n`;
    node += `const options = {\n  method: "${method}",\n  headers: {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n  }`;
    if (bodyStr) {
      node += `,\n  body: JSON.stringify(${JSON.stringify(mockRequestPayload, null, 2)})\n`;
    } else {
      node += `\n`;
    }
    node += `};\n\ntry {\n  const response = await fetch(url, options);\n  const data = await response.json();\n  console.log(data);\n} catch (error) {\n  console.error("Error:", error);\n}`;

    // Python Snippet
    let python = `import requests\n\n`;
    python += `url = "${fullUrl}"\n`;
    python += `headers = {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n}\n`;
    if (mockRequestPayload) {
      python += `payload = ${JSON.stringify(mockRequestPayload, null, 4).replace(/true/g, "True").replace(/false/g, "False").replace(/null/g, "None")}\n`;
      python += `response = requests.${method.toLowerCase()}(url, json=payload, headers=headers)\n`;
    } else {
      python += `response = requests.${method.toLowerCase()}(url, headers=headers)\n`;
    }
    python += `print(response.json())\n`;

    return { curl, node, python };
  }, [activeEndpoint, mockRequestPayload, activeEndpointId, selectedCmsTarget]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const toggleGroup = (tag: string) => {
    setExpandedGroups((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  // Helper to render schemas in intermediate tabular format
  const renderSchemaProperties = (properties: any, requiredList: string[] = [], prefix = "") => {
    if (!properties) return null;

    return Object.entries(properties).map(([key, prop]: [string, any]) => {
      const isRequired = requiredList.includes(key);
      const isObject = prop.type === "object";
      const isArray = prop.type === "array";

      return (
        <div key={prefix + key} className="py-3 border-b border-[#1E293B]/60 text-sm">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-[#F1E9D8] font-bold">{prefix + key}</span>
            <span className="text-[#C89A4B] text-xs font-mono font-semibold">{prop.type || "any"}</span>
            {isRequired && (
              <span className="text-red-400 text-xs font-mono uppercase tracking-wider font-semibold">
                required
              </span>
            )}
          </div>
          {prop.description && <p className="text-[#94A3B8] mt-1 text-xs leading-relaxed">{prop.description}</p>}
          {prop.enum && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[#C89A4B]/80 text-xs font-mono font-semibold">Allowed values:</span>
              {prop.enum.map((val: string) => (
                <span key={val} className="bg-[#111A2E] text-[#94A3B8] px-1.5 py-0.5 rounded text-xs font-mono border border-[#1E293B]">
                  {val}
                </span>
              ))}
            </div>
          )}
          {isObject && prop.properties && (
            <div className="pl-4 mt-2 border-l border-[#C89A4B]/20">
              {renderSchemaProperties(prop.properties, prop.required || [], `${prefix + key}.`)}
            </div>
          )}
          {isArray && prop.items && prop.items.properties && (
            <div className="pl-4 mt-2 border-l border-[#C89A4B]/20">
              <div className="text-xs text-[#C89A4B]/60 font-mono mb-2">Array Item properties:</div>
              {renderSchemaProperties(prop.items.properties, prop.items.required || [], `${prefix + key}[].`)}
            </div>
          )}
        </div>
      );
    });
  };

  // Guide Simulator State
  const [simName, setSimName] = useState("Artisan Sourdough Masterclass");
  const [simMarkdown, setSimMarkdown] = useState("# Sourdough Masterclass 🌾\nLearn organic sourdough baking.\n\n- Organic ingredients\n- Stone-hearth oven");
  const [simSeoTitle, setSimSeoTitle] = useState("Artisan Sourdough Baking Masterclass");
  const [simImageUrl, setSimImageUrl] = useState("https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600");
  const [simAttrValue, setSimAttrValue] = useState("Marie Dubois");

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F1E9D8] flex flex-col font-sans">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 border-b border-[#1E293B] bg-[#0B1220]/95 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#34A853] flex items-center justify-center font-extrabold text-white">
            S
          </div>
          <span className="font-bold tracking-wider text-white">SCRYME V3</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-[#F1E9D8] hover:text-[#C89A4B] transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {/* Sidebar Left Column */}
        <aside
          className={`fixed inset-y-16 lg:inset-y-0 left-0 w-80 bg-[#0B1220] border-r border-[#1E293B] overflow-y-auto z-40 transition-transform duration-300 transform
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:h-screen flex flex-col`}
        >
          {/* Brand Header */}
          <div className="hidden lg:flex p-6 items-center gap-3 border-b border-[#1E293B]">
            <div className="w-9 h-9 rounded-lg bg-[#34A853] flex items-center justify-center font-black text-white text-lg shadow-md shadow-[#34A853]/20">
              S
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-white block text-sm">SCRYME LEDGER</span>
              <span className="text-[10px] text-[#C89A4B] uppercase tracking-widest font-bold">V3 API reference</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-4 border-b border-[#1E293B]/60">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={16} />
              <input
                type="text"
                placeholder="Search specs & guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111A2E] text-white pl-9 pr-4 py-2 rounded-lg border border-[#1E293B] focus:outline-none focus:border-[#C89A4B] text-xs transition-colors placeholder-[#94A3B8]/60"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Core Pinned Customization Guide */}
            {showGuideInSearch && (
              <div className="space-y-1">
                <span className="text-[10px] text-[#C89A4B] uppercase tracking-widest font-black px-2 block mb-1">Guides</span>
                <button
                  onClick={() => {
                    setActiveEndpointId("cms-customization-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-left text-xs transition-all duration-200 ${
                    activeEndpointId === "cms-customization-guide"
                      ? "bg-[#C89A4B]/20 text-white font-semibold border-l-2 border-[#C89A4B]"
                      : "text-[#94A3B8] hover:text-[#F1E9D8] hover:bg-[#111A2E]"
                  }`}
                >
                  <BookOpen size={14} className="text-[#C89A4B]" />
                  <span className="font-bold truncate">CMS Customization Engine</span>
                </button>
              </div>
            )}

            <div className="border-t border-[#1E293B]/40 my-2" />

            <span className="text-[10px] text-[#C89A4B] uppercase tracking-widest font-black px-2 block">API References</span>

            {Object.entries(filteredTagGroups).map(([tag, eps]) => {
              const isExpanded = !!expandedGroups[tag];
              return (
                <div key={tag} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(tag)}
                    className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-[#C89A4B] py-1 px-2 hover:text-white rounded-lg transition-colors"
                  >
                    <span>{tag.replace("V3 ", "")}</span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isExpanded && (
                    <div className="pl-2 space-y-1">
                      {eps.map((ep) => {
                        const isActive = activeEndpointId === ep.operationId;
                        return (
                          <button
                            key={ep.operationId}
                            onClick={() => {
                              setActiveEndpointId(ep.operationId);
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 py-1.5 px-3 rounded-lg text-left text-xs transition-all duration-200 ${
                              isActive
                                ? "bg-[#C89A4B]/15 text-[#F1E9D8] font-semibold border-l-2 border-[#C89A4B]"
                                : "text-[#94A3B8] hover:text-[#F1E9D8] hover:bg-[#111A2E]"
                            }`}
                          >
                            <span
                              className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono ${
                                ep.method === "GET"
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                  : ep.method === "POST"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : ep.method === "DELETE"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                              }`}
                            >
                              {ep.method}
                            </span>
                            <span className="truncate">{ep.summary || ep.path}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer inside Sidebar */}
          <div className="p-4 border-t border-[#1E293B] text-[10px] text-[#94A3B8]/60 flex items-center justify-between">
            <span>Server Status: <span className="text-[#34A853] font-semibold">Online</span></span>
            <span>v3.0.0</span>
          </div>
        </aside>

        {/* Content Wrapper (Middle + Right columns) */}
        <main className="flex-1 lg:grid lg:grid-cols-12 min-h-screen">

          {/* MIDDLE COLUMN */}
          <section className="col-span-7 p-6 lg:p-12 overflow-y-auto space-y-10 border-r border-[#1E293B]/60 max-w-4xl">
            {activeEndpointId === "cms-customization-guide" ? (
              // --- GORGEOUS HIGH-FIDELITY CMS CUSTOMIZATION ENGINE RENDER VIEW ---
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 text-xs text-[#C89A4B] uppercase tracking-wider font-semibold mb-2">
                    <span>Developer Guide</span>
                    <span>&bull;</span>
                    <span>Storefront & Catalog CMS</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white leading-tight">
                    CMS Customization Engine
                  </h1>
                  <p className="text-[#94A3B8] text-sm mt-2 leading-relaxed">
                    Scryme V3 powers highly customizable, media-rich catalogs using a flexible database column structure. This guide explains how third-party and headless storefront developers utilize the dynamic <code className="text-white bg-[#111A2E] px-1 py-0.5 border border-[#1E293B] font-mono text-xs">customFields</code> JSON payload to build exceptional storefront and booking experiences.
                  </p>
                </div>

                {/* Conceptual Card */}
                <div className="bg-[#111A2E]/50 rounded-xl border border-[#1E293B] p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[#C89A4B] font-bold text-sm">
                    <Layers size={16} />
                    <span>Prisma JSON Column Mapping</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    The <code className="text-white">Product</code> and <code className="text-white">Service</code> schemas each contain a schema-free nullable <code className="text-[#C89A4B] font-mono font-semibold">customFields</code> field. This layout completely bypasses rigid database structures, permitting organizations to serialize rich-media elements, Markdown descriptions, SEO details, and custom technical specification attributes without database schema migrations.
                  </p>
                </div>

                {/* Main Customize Parameters Section */}
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white border-b border-[#1E293B] pb-2">CMS Payload Specifications</h2>

                  {/* 1. markdownDescription */}
                  <div className="border border-[#1E293B] rounded-xl bg-[#080d17] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#F1E9D8] font-black text-sm">markdownDescription</span>
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">string</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Accepts GitHub Flavored Markdown (GFM) formatting. Headless storefronts parse this dynamically to output formatted guides, rich tables, blockquotes, and lists for services or product details.
                    </p>
                  </div>

                  {/* 2. images */}
                  <div className="border border-[#1E293B] rounded-xl bg-[#080d17] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#F1E9D8] font-black text-sm">images</span>
                      <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">array of objects</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Ordered gallery of uploaded image assets. The primary image is defined at index <code className="text-white font-mono">0</code>.
                    </p>
                    <div className="bg-[#111A2E] rounded-lg border border-[#1E293B] p-3 text-xs font-mono space-y-1.5">
                      <div className="text-white font-bold pb-1 border-b border-[#1E293B]/60 text-[10px] uppercase text-[#C89A4B]">ImageItem Schema:</div>
                      <div>• <span className="text-[#F1E9D8] font-bold">id</span> (string): Unique image ID (crucial for react rendering keys).</div>
                      <div>• <span className="text-[#F1E9D8] font-bold">url</span> (string): Absolute URL to CDN image asset.</div>
                      <div>• <span className="text-[#F1E9D8] font-bold">caption</span> (string): Alt text for accessibility and crawl performance.</div>
                    </div>
                  </div>

                  {/* 3. seo */}
                  <div className="border border-[#1E293B] rounded-xl bg-[#080d17] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#F1E9D8] font-black text-sm">seo</span>
                      <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">object</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Custom HTML page headers to override default metadata tags dynamically.
                    </p>
                    <div className="bg-[#111A2E] rounded-lg border border-[#1E293B] p-3 text-xs font-mono space-y-1.5">
                      <div className="text-white font-bold pb-1 border-b border-[#1E293B]/60 text-[10px] uppercase text-[#C89A4B]">Seo Schema:</div>
                      <div>• <span className="text-[#F1E9D8] font-bold">title</span> (string): Custom browser tab title. Max 60 chars.</div>
                      <div>• <span className="text-[#F1E9D8] font-bold">description</span> (string): Search card snippet. Max 160 chars.</div>
                      <div>• <span className="text-[#F1E9D8] font-bold">keywords</span> (string): Comma-separated tag phrases.</div>
                    </div>
                  </div>

                  {/* 4. customAttributes */}
                  <div className="border border-[#1E293B] rounded-xl bg-[#080d17] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#F1E9D8] font-black text-sm">customAttributes</span>
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">object (dictionary)</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Key-value map representing dynamic parameters. This supports advanced faceted filters in storefront lists (e.g. searching items filtered by <code className="text-white">difficulty</code> or <code className="text-white">material</code>) without rigid database specifications. Keys must be strictly <code className="text-white">snake_case</code> or <code className="text-white">lowercase</code>.
                    </p>
                  </div>

                  {/* eCommerce Controls */}
                  <div className="border border-[#1E293B] rounded-xl bg-[#080d17] p-5 space-y-4">
                    <div className="flex items-center gap-2 font-bold text-white text-sm pb-1.5 border-b border-[#1E293B]/40">
                      <Workflow size={16} className="text-[#C89A4B]" />
                      <span>Product Specific eCommerce Lifecycle Options</span>
                    </div>
                    <div className="divide-y divide-[#1E293B]/60 text-xs">
                      <div className="py-2.5 flex items-baseline justify-between gap-2">
                        <div>
                          <code className="text-[#F1E9D8] font-bold">publishStatus</code>
                          <span className="text-[#94A3B8] block text-[10px]">Values: Draft | Published | Scheduled | Archived</span>
                        </div>
                        <span className="text-[#C89A4B] font-semibold text-[10px] font-mono">string</span>
                      </div>
                      <div className="py-2.5 flex items-baseline justify-between gap-2">
                        <div>
                          <code className="text-[#F1E9D8] font-bold">publishedAt</code>
                          <span className="text-[#94A3B8] block text-[10px]">ISO timestamp of release schedule</span>
                        </div>
                        <span className="text-[#C89A4B] font-semibold text-[10px] font-mono">ISO8601 string / null</span>
                      </div>
                      <div className="py-2.5 flex items-baseline justify-between gap-2">
                        <div>
                          <code className="text-[#F1E9D8] font-bold">layoutTemplate</code>
                          <span className="text-[#94A3B8] block text-[10px]">Visual layout style token for the headless portal</span>
                        </div>
                        <span className="text-[#C89A4B] font-semibold text-[10px] font-mono">string</span>
                      </div>
                      <div className="py-2.5 flex items-baseline justify-between gap-2">
                        <div>
                          <code className="text-[#F1E9D8] font-bold">customSlugOverride</code>
                          <span className="text-[#94A3B8] block text-[10px]">Targeted override of SEO friendly URL slugs</span>
                        </div>
                        <span className="text-[#C89A4B] font-semibold text-[10px] font-mono">string</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Storefront Live Simulator */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white border-b border-[#1E293B] pb-2">Dynamic Storefront Live Simulator</h2>
                  <p className="text-xs text-[#94A3B8]">
                    Modify the live mock parameters below and watch the simulated storefront resolve the raw CMS payload in real-time.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#111A2E]/30 border border-[#1E293B] rounded-xl p-4">
                    {/* Simulator Controls */}
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#C89A4B]">Service Name</label>
                        <input
                          type="text"
                          value={simName}
                          onChange={(e) => setSimName(e.target.value)}
                          className="w-full bg-[#0B1220] border border-[#1E293B] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C89A4B]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#C89A4B]">markdownDescription</label>
                        <textarea
                          value={simMarkdown}
                          onChange={(e) => setSimMarkdown(e.target.value)}
                          className="w-full h-20 bg-[#0B1220] border border-[#1E293B] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#C89A4B] resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#C89A4B]">Primary Image URL</label>
                        <input
                          type="text"
                          value={simImageUrl}
                          onChange={(e) => setSimImageUrl(e.target.value)}
                          className="w-full bg-[#0B1220] border border-[#1E293B] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C89A4B]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#C89A4B]">SEO Title Tag</label>
                        <input
                          type="text"
                          value={simSeoTitle}
                          onChange={(e) => setSimSeoTitle(e.target.value)}
                          className="w-full bg-[#0B1220] border border-[#1E293B] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C89A4B]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#C89A4B]">Attribute: instructor_name</label>
                        <input
                          type="text"
                          value={simAttrValue}
                          onChange={(e) => setSimAttrValue(e.target.value)}
                          className="w-full bg-[#0B1220] border border-[#1E293B] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C89A4B]"
                        />
                      </div>
                    </div>

                    {/* Simulated Storefront Card */}
                    <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col justify-between shadow-xl">
                      {/* Browser tab bar preview */}
                      <div className="bg-[#111A2E] border-b border-[#1E293B] px-3 py-2 flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-mono">
                        <Globe size={11} className="text-[#C89A4B]" />
                        <span className="truncate">{simSeoTitle || "Storefront Browser Tab"}</span>
                      </div>

                      <div className="relative aspect-video bg-[#111A2E]">
                        <img
                          src={simImageUrl}
                          alt="Simulated storefront cover"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600";
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-6 text-left">
                          <span className="text-[8px] font-black uppercase tracking-widest text-[#C89A4B]">Premium Sourdough</span>
                          <h4 className="text-sm font-bold text-white truncate">{simName || "Unnamed Service"}</h4>
                        </div>
                      </div>

                      <div className="p-4 space-y-3 text-left">
                        {/* Custom attributes tag */}
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-[#111A2E] border border-[#1E293B] text-[#94A3B8] px-2 py-0.5 rounded text-[10px] font-mono">
                            instructor: <span className="text-[#F1E9D8] font-semibold">{simAttrValue}</span>
                          </span>
                        </div>

                        {/* Parsed markdown */}
                        <div className="border border-[#1E293B]/60 p-2 rounded bg-[#111A2E]/40 text-[11px] leading-relaxed text-[#94A3B8] max-h-24 overflow-y-auto font-sans scrollbar-thin">
                          <strong className="text-white block font-bold text-xs mb-1">Storefront About / Specifications</strong>
                          <p className="whitespace-pre-line">{simMarkdown}</p>
                        </div>

                        <button className="w-full bg-[#C89A4B] text-[#0B1220] font-black uppercase text-[10px] py-2 tracking-widest hover:bg-white transition-colors duration-200">
                          Secure Spot
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeEndpoint ? (
              // --- STANDARD ENDPOINT DETAILED VIEW ---
              <div className="space-y-8">
                {/* Header Information */}
                <div>
                  <div className="flex items-center gap-3 text-xs text-[#C89A4B] uppercase tracking-wider font-semibold mb-2">
                    <span>API Reference</span>
                    <span>&bull;</span>
                    <span>{activeEndpoint.tag}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white leading-tight">
                    {activeEndpoint.summary}
                  </h1>
                </div>

                {/* HTTP Endpoint Tag & Path */}
                <div className="bg-[#111A2E] rounded-xl border border-[#1E293B] p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-md uppercase font-mono tracking-wider ${
                        activeEndpoint.method === "GET"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : activeEndpoint.method === "POST"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : activeEndpoint.method === "DELETE"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {activeEndpoint.method}
                    </span>
                    <code className="text-[#F1E9D8] font-mono text-sm break-all font-bold">
                      {getDynamicUrl(activeEndpoint.path)}
                    </code>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#94A3B8] bg-[#0B1220] px-3 py-1.5 rounded-lg border border-[#1E293B]">
                    <Lock size={12} className="text-[#C89A4B]" />
                    <span className="font-mono">Bearer Token</span>
                  </div>
                </div>

                {/* Description */}
                {activeEndpoint.description && (
                  <div className="space-y-2">
                    <h2 className="text-sm uppercase tracking-widest font-black text-[#C89A4B]">Description</h2>
                    <p className="text-[#94A3B8] text-sm leading-relaxed whitespace-pre-line">
                      {activeEndpoint.description}
                    </p>
                  </div>
                )}

                {/* Path/Query Parameters */}
                {activeEndpoint.parameters && activeEndpoint.parameters.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-sm uppercase tracking-widest font-black text-[#C89A4B]">Parameters</h2>
                    <div className="border border-[#1E293B] rounded-xl bg-[#111A2E]/55 p-4 divide-y divide-[#1E293B]/60">
                      {activeEndpoint.parameters.map((param: any) => (
                        <div key={param.name} className="py-3 first:pt-0 last:pb-0 text-sm">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-mono text-white font-bold">{param.name}</span>
                            <span className="text-[#C89A4B] text-xs font-mono font-semibold">
                              {param.schema?.type || "string"}
                            </span>
                            <span className="bg-[#0B1220] text-[#94A3B8] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#1E293B] uppercase">
                              {param.in}
                            </span>
                            {param.required && (
                              <span className="text-red-400 text-[10px] font-mono uppercase font-bold tracking-wider">
                                required
                              </span>
                            )}
                          </div>
                          {param.description && (
                            <p className="text-[#94A3B8] mt-1 text-xs leading-relaxed">{param.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Request Body Properties */}
                {requestBodySchema && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm uppercase tracking-widest font-black text-[#C89A4B]">
                        Request Body
                      </h2>
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                        json
                      </span>
                    </div>

                    <div className="border border-[#1E293B] rounded-xl bg-[#111A2E]/55 p-4">
                      {requestBodySchema.properties ? (
                        <div className="divide-y divide-[#1E293B]/60">
                          {renderSchemaProperties(requestBodySchema.properties, requestBodySchema.required || [])}
                        </div>
                      ) : (
                        <p className="text-[#94A3B8] text-xs font-mono">Any valid JSON object</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <BookOpen size={48} className="text-[#C89A4B] mb-4 animate-pulse" />
                <h3 className="text-xl font-bold">Select an API Endpoint</h3>
                <p className="text-[#94A3B8] text-sm mt-2">Explore Scryme Ledger's high-performance endpoints from the left navigation.</p>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN */}
          <section className="col-span-5 bg-[#080d17] p-6 lg:p-12 overflow-y-auto space-y-8 sticky top-0 lg:h-screen flex flex-col justify-between border-t lg:border-t-0 border-[#1E293B]">
            <div className="space-y-6 flex-1">

              {/* Target / Target Language Selector */}
              <div className="space-y-3">

                {/* CMS Target selector (only shown when the Guide is active) */}
                {activeEndpointId === "cms-customization-guide" && (
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                    <span className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest flex items-center gap-1">
                      <Fingerprint size={12} className="text-[#C89A4B]" />
                      <span>CMS Schema Mode</span>
                    </span>
                    <div className="bg-[#111A2E] p-0.5 border border-[#1E293B] rounded flex gap-1">
                      <button
                        onClick={() => setSelectedCmsTarget("service")}
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-1 transition-colors ${
                          selectedCmsTarget === "service" ? "bg-[#C89A4B] text-[#0B1220]" : "text-[#94A3B8]"
                        }`}
                      >
                        Service Schema
                      </button>
                      <button
                        onClick={() => setSelectedCmsTarget("product")}
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-1 transition-colors ${
                          selectedCmsTarget === "product" ? "bg-[#C89A4B] text-[#0B1220]" : "text-[#94A3B8]"
                        }`}
                      >
                        Product Schema
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-[#C89A4B]">
                    <Code size={14} />
                    <span>Request Snippet</span>
                  </div>
                  {/* Language Tab buttons */}
                  <div className="bg-[#111A2E] rounded-lg p-1 border border-[#1E293B] flex gap-1">
                    {(["curl", "node", "python"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLanguage(lang)}
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded transition-colors ${
                          codeLanguage === lang ? "bg-[#C89A4B] text-[#0B1220]" : "text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        {lang === "curl" ? "cURL" : lang === "node" ? "Node" : "Python"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group rounded-xl overflow-hidden bg-[#0B1220] border border-[#1E293B] p-4 text-xs font-mono shadow-xl">
                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(codeSnippets[codeLanguage], "request")}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-[#111A2E] text-[#94A3B8] hover:text-white border border-[#1E293B] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    {copiedMap["request"] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>

                  <pre className="overflow-x-auto text-[#F1E9D8] whitespace-pre leading-relaxed select-all no-scrollbar max-h-96">
                    <code>{codeSnippets[codeLanguage]}</code>
                  </pre>
                </div>
              </div>

              {/* Response Block */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-[#C89A4B]">
                    <Terminal size={14} />
                    <span>Response Payload</span>
                  </div>
                  <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
                    200 ok
                  </span>
                </div>

                <div className="relative group rounded-xl overflow-hidden bg-[#0B1220] border border-[#1E293B] p-4 text-xs font-mono shadow-xl">
                  {/* Copy Button */}
                  <button
                    onClick={() => {
                      const text = activeEndpointId === "cms-customization-guide"
                        ? JSON.stringify({ success: true, message: "CMS options updated successfully" }, null, 2)
                        : JSON.stringify(mockResponsePayload, null, 2);
                      handleCopy(text, "response");
                    }}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-[#111A2E] text-[#94A3B8] hover:text-white border border-[#1E293B] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    {copiedMap["response"] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>

                  <pre className="overflow-x-auto text-green-300 whitespace-pre leading-relaxed no-scrollbar max-h-[350px]">
                    <code>
                      {activeEndpointId === "cms-customization-guide"
                        ? JSON.stringify({ success: true, message: `${selectedCmsTarget === "service" ? "Service" : "Product"} CMS options persisted successfully` }, null, 2)
                        : JSON.stringify(mockResponsePayload, null, 2)}
                    </code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Quick Helper Docs */}
            <div className="pt-6 border-t border-[#1E293B]/60 hidden lg:block">
              <div className="bg-[#111A2E]/40 border border-[#1E293B]/60 rounded-xl p-4 text-xs space-y-2">
                <div className="font-bold text-[#C89A4B] flex items-center gap-1">
                  <Fingerprint size={12} />
                  <span>Sandbox Credentials</span>
                </div>
                <p className="text-[#94A3B8] leading-relaxed">
                  Use the <code className="text-white">/v3/auth/token</code> endpoint in sandbox mode to exchange client credentials. All write operations require a valid organization scope.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
