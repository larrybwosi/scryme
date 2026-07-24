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
      if (tagGroups[tags[0]] && tagGroups[tags[0]].length > 0) {
        setActiveEndpointId(tagGroups[tags[0]][0].operationId);
      }
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

  const activeEndpoint = useMemo(() => {
    return endpoints.find((ep) => ep.operationId === activeEndpointId) || endpoints[0];
  }, [endpoints, activeEndpointId]);

  // JSON Schema Ref Resolver Helper
  const resolveSchema = (schema: any): any => {
    if (!schema) return null;
    if (schema.$ref) {
      const refName = schema.$ref.split("/").pop();
      const resolved = (openapiSpec.components as any)?.schemas?.[refName];
      if (resolved) {
        return resolveSchema(resolved);
      }
    }
    if (schema.type === "object" && schema.properties) {
      const resolvedProperties: any = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        resolvedProperties[key] = resolveSchema(value);
      }
      return { ...schema, properties: resolvedProperties };
    }
    if (schema.type === "array" && schema.items) {
      return { ...schema, items: resolveSchema(schema.items) };
    }
    return schema;
  };

  // Mock JSON payload builder from resolved schema
  const generateMockFromSchema = (schema: any): any => {
    const resolved = resolveSchema(schema);
    if (!resolved) return null;

    if (resolved.example !== undefined) return resolved.example;
    if (resolved.default !== undefined) return resolved.default;

    if (resolved.type === "object") {
      const obj: any = {};
      if (resolved.properties) {
        for (const [key, prop] of Object.entries(resolved.properties)) {
          obj[key] = generateMockFromSchema(prop);
        }
      }
      return obj;
    }
    if (resolved.type === "array") {
      const childMock = generateMockFromSchema(resolved.items);
      return childMock ? [childMock] : [];
    }
    if (resolved.type === "string") {
      if (resolved.format === "date-time") return new Date().toISOString();
      if (resolved.format === "email") return "developer@scryme.tech";
      if (resolved.enum) return resolved.enum[0];
      return "string_value";
    }
    if (resolved.type === "number" || resolved.type === "integer") {
      return 100;
    }
    if (resolved.type === "boolean") {
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
  }, [activeEndpoint, mockRequestPayload]);

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
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111A2E] text-white pl-9 pr-4 py-2 rounded-lg border border-[#1E293B] focus:outline-none focus:border-[#C89A4B] text-xs transition-colors placeholder-[#94A3B8]/60"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
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
          {/* Middle Column (Documentation Text) */}
          <section className="col-span-7 p-6 lg:p-12 overflow-y-auto space-y-10 border-r border-[#1E293B]/60 max-w-4xl">
            {activeEndpoint ? (
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

          {/* Right Column (Code blocks & Mock responses) */}
          <section className="col-span-5 bg-[#080d17] p-6 lg:p-12 overflow-y-auto space-y-8 sticky top-0 lg:h-screen flex flex-col justify-between border-t lg:border-t-0 border-[#1E293B]">
            <div className="space-y-6 flex-1">
              {/* Code Snippet Block */}
              <div className="space-y-3">
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
                    onClick={() => handleCopy(JSON.stringify(mockResponsePayload, null, 2), "response")}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-[#111A2E] text-[#94A3B8] hover:text-white border border-[#1E293B] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    {copiedMap["response"] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>

                  <pre className="overflow-x-auto text-green-300 whitespace-pre leading-relaxed no-scrollbar max-h-[350px]">
                    <code>{JSON.stringify(mockResponsePayload, null, 2)}</code>
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
