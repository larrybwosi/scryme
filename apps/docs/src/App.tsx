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
  Sun,
  Moon,
  Play,
  Send,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import openapiSpec from "./openapi.json";

// --- Design Tokens (Scryme) ---
const colors = {
  inkBg: "var(--bg-color)",
  inkCard: "var(--card-color)",
  inkBorder: "var(--border-color)",
  brass: "#C89A4B",
  paper: "var(--text-color)",
  lightText: "var(--light-text-color)",
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

// Preset definitions for CMS Customization Simulator
const PRESETS = {
  sourdough: {
    name: "Artisan Sourdough Masterclass",
    sku: "SRV-BKA-001",
    price: 120.00,
    markdownDescription: "# Sourdough Masterclass 🌾\nLearn fermentation secrets from our master bakers.\n\n### Outline\n- Wild yeast starter cultivation\n- High-hydration mixing\n- Bulk proofing & scoring",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
    seoTitle: "Artisan Sourdough Masterclass | Scryme Bakery",
    seoDesc: "Learn organic sourdough artisan baking techniques in a 4-hour hands-on class.",
    instructor: "Marie Dubois",
  },
  banneton: {
    name: "Premium Round Proofing Banneton",
    sku: "PROD-BKA-BANN-02",
    price: 24.99,
    markdownDescription: "# Round Cane Proofing Banneton 🧺\nHand-crafted from 100% natural organic Indonesian rattan cane.\n\n## Features\n- Draws moisture away for crisper crust\n- Flour leaves beautiful spiral designs",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
    seoTitle: "Premium Indonesian Cane Banneton | Scryme Shop",
    seoDesc: "Buy premium Indonesian cane rattan proofing banneton baskets with linen liners.",
    instructor: "N/A (Product)",
  },
  spa: {
    name: "Traditional Swedish Massage",
    sku: "SRV-SPA-004",
    price: 85.00,
    markdownDescription: "# Traditional Swedish Massage 💆‍♀️\nRestore balance and ease tension with our signature body therapy.\n\n### Benefits\n- Stimulates lymphatic system\n- Relieves chronic muscle tightness\n- Promotes deep full-body relaxation",
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
    seoTitle: "Swedish Body Therapy Massage | Scryme Spa",
    seoDesc: "Relax and rejuvenate with our signature swedish body therapy and hot oils.",
    instructor: "Sarah Jenkins",
  }
};

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
      return localStorage.getItem("theme") as "dark" | "light";
    }
    return "dark";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [activeEndpointId, setActiveEndpointId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "node" | "python">("curl");
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Playground & Interactive Tabs State
  const [activeDocTab, setActiveDocTab] = useState<"reference" | "playground" | "schema">("reference");
  const [playgroundParams, setPlaygroundParams] = useState<Record<string, string>>({});
  const [playgroundBody, setPlaygroundBody] = useState<Record<string, any>>({});
  const [isPlayingLoading, setIsPlayingLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);

  // CMS Guide Pinned Navigation State
  const [selectedCmsTarget, setSelectedCmsTarget] = useState<"service" | "product">("service");
  const [cmsPreviewTab, setCmsPreviewTab] = useState<"preview" | "payload">("preview");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Apply dark/light class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Keyboard shortcut listener for focusing search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/") {
        // If not in input or textarea
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

        // Hide finance documentation for now
        if (primaryTag && primaryTag.toLowerCase().includes("finance")) {
          continue;
        }

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

  // Initialize playground fields when active endpoint changes
  useEffect(() => {
    if (activeEndpoint && activeEndpointId !== "cms-customization-guide") {
      const defaultParams: Record<string, string> = {};
      activeEndpoint.parameters?.forEach((p) => {
        if (p.name === "orgSlug") {
          defaultParams[p.name] = "bakery-co";
        } else {
          defaultParams[p.name] = p.schema?.default || "";
        }
      });
      setPlaygroundParams(defaultParams);

      const resolved = resolveSchema(activeEndpoint.requestBody?.content?.["application/json"]?.schema);
      if (resolved && resolved.properties) {
        const mockBody = generateMockFromSchema(resolved);
        setPlaygroundBody(mockBody || {});
      } else {
        setPlaygroundBody({});
      }

      setPlaygroundResponse(null);
      setActiveDocTab("reference");
    }
  }, [activeEndpointId]);

  // JSON Schema Ref Resolver Helper with cycle detection and depth limit
  const resolveSchema = (schema: any, visited = new Set<string>(), depth = 0): any => {
    if (!schema || depth > 8) return null;
    if (schema.$ref) {
      const refName = schema.$ref.split("/").pop();
      if (refName) {
        if (visited.has(refName)) {
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

    if (schema.$ref) {
      const refName = schema.$ref.split("/").pop();
      if (refName) {
        if (visitedRefs.has(refName)) {
          return {};
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
    if (activeEndpointId === "cms-customization-guide") return null;
    if (activeDocTab === "playground") {
      return playgroundBody;
    }
    if (!activeEndpoint || !activeEndpoint.requestBody) return null;
    const content = activeEndpoint.requestBody.content;
    const jsonContent = content?.["application/json"];
    return jsonContent?.schema ? generateMockFromSchema(jsonContent.schema) : null;
  }, [activeEndpoint, activeDocTab, playgroundBody, activeEndpointId]);

  // Extract Mock Response payload
  const mockResponsePayload = useMemo(() => {
    if (!activeEndpoint) return null;
    const successResponse = activeEndpoint.responses?.["200"] || activeEndpoint.responses?.["201"];
    if (!successResponse) return { success: true };
    const content = successResponse.content;
    const jsonContent = content?.["application/json"];
    return jsonContent?.schema ? generateMockFromSchema(jsonContent.schema) : { success: true };
  }, [activeEndpoint]);

  // Dynamic URL with path variables and query parameters populated
  const getDynamicUrl = (path: string) => {
    let finalPath = path;
    const queryParams: string[] = [];

    // Replace Path variables with playground states
    Object.entries(playgroundParams).forEach(([key, val]) => {
      const isPath = path.includes(`{${key}}`);
      if (isPath) {
        finalPath = finalPath.replace(`{${key}}`, val || `{${key}}`);
      } else if (val) {
        // Assume query parameter
        queryParams.push(`${key}=${encodeURIComponent(val)}`);
      }
    });

    if (queryParams.length > 0) {
      return `${finalPath}?${queryParams.join("&")}`;
    }
    return finalPath;
  };

  // Guide Simulator State (Defaults to sourdough)
  const [simName, setSimName] = useState(PRESETS.sourdough.name);
  const [simSku, setSimSku] = useState(PRESETS.sourdough.sku);
  const [simPrice, setSimPrice] = useState(PRESETS.sourdough.price);
  const [simMarkdown, setSimMarkdown] = useState(PRESETS.sourdough.markdownDescription);
  const [simSeoTitle, setSimSeoTitle] = useState(PRESETS.sourdough.seoTitle);
  const [simSeoDesc, setSimSeoDesc] = useState(PRESETS.sourdough.seoDesc);
  const [simImageUrl, setSimImageUrl] = useState(PRESETS.sourdough.imageUrl);
  const [simAttrValue, setSimAttrValue] = useState(PRESETS.sourdough.instructor);

  // Apply simulator presets
  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const data = PRESETS[presetKey];
    setSimName(data.name);
    setSimSku(data.sku);
    setSimPrice(data.price);
    setSimMarkdown(data.markdownDescription);
    setSimSeoTitle(data.seoTitle);
    setSimSeoDesc(data.seoDesc);
    setSimImageUrl(data.imageUrl);
    setSimAttrValue(data.instructor);
  };

  // Generate dynamic Code Snippets
  const codeSnippets = useMemo(() => {
    if (activeEndpointId === "cms-customization-guide") {
      const baseUrl = "https://api.scryme.tech/v3";

      const targetPayload = {
        name: simName,
        sku: simSku,
        price: simPrice,
        customFields: {
          markdownDescription: simMarkdown,
          images: [
            {
              id: "img_cms_primary",
              url: simImageUrl,
              caption: simName
            }
          ],
          seo: {
            title: simSeoTitle,
            description: simSeoDesc,
            keywords: "baking, premium"
          },
          customAttributes: {
            instructor_name: simAttrValue
          }
        }
      };

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
    const path = getDynamicUrl(activeEndpoint.path);
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
  }, [activeEndpoint, mockRequestPayload, activeEndpointId, selectedCmsTarget, playgroundParams, playgroundBody, simName, simSku, simPrice, simMarkdown, simImageUrl, simSeoTitle, simSeoDesc, simAttrValue]);

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

  const expandAllGroups = () => {
    const next: Record<string, boolean> = {};
    Object.keys(tagGroups).forEach((tag) => {
      next[tag] = true;
    });
    setExpandedGroups(next);
  };

  const collapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    Object.keys(tagGroups).forEach((tag) => {
      next[tag] = false;
    });
    setExpandedGroups(next);
  };

  // Simulated API request action
  const sendSimulatedRequest = () => {
    setIsPlayingLoading(true);
    setTimeout(() => {
      setIsPlayingLoading(false);
      setPlaygroundResponse(mockResponsePayload || { success: true });
    }, 1000);
  };

  // Next and Previous pagination logic
  const chronologicalList = useMemo(() => {
    const list: { id: string; type: "guide" | "api"; name: string }[] = [
      { id: "cms-customization-guide", type: "guide", name: "CMS Customization Engine" }
    ];
    endpoints.forEach((ep) => {
      list.push({ id: ep.operationId, type: "api", name: ep.summary || ep.path });
    });
    return list;
  }, [endpoints]);

  const currentChronoIndex = useMemo(() => {
    return chronologicalList.findIndex((item) => item.id === activeEndpointId);
  }, [chronologicalList, activeEndpointId]);

  const handlePrevPage = () => {
    if (currentChronoIndex > 0) {
      setActiveEndpointId(chronologicalList[currentChronoIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (currentChronoIndex < chronologicalList.length - 1) {
      setActiveEndpointId(chronologicalList[currentChronoIndex + 1].id);
    }
  };

  // Helper to render schemas in intermediate tabular format
  const renderSchemaProperties = (properties: any, requiredList: string[] = [], prefix = "") => {
    if (!properties) return null;

    return Object.entries(properties).map(([key, prop]: [string, any]) => {
      const isRequired = requiredList.includes(key);
      const isObject = prop.type === "object";
      const isArray = prop.type === "array";

      return (
        <div key={prefix + key} className="py-3 border-b border-ink-border/60 text-sm">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-paper font-bold">{prefix + key}</span>
            <span className="text-brass text-xs font-mono font-semibold">{prop.type || "any"}</span>
            {isRequired && (
              <span className="text-red-400 text-xs font-mono uppercase tracking-wider font-semibold">
                required
              </span>
            )}
          </div>
          {prop.description && <p className="text-light-text mt-1 text-xs leading-relaxed">{prop.description}</p>}
          {prop.enum && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-brass/80 text-xs font-mono font-semibold">Allowed values:</span>
              {prop.enum.map((val: string) => (
                <span key={val} className="bg-ink-bg text-light-text px-1.5 py-0.5 rounded text-xs font-mono border border-ink-border">
                  {val}
                </span>
              ))}
            </div>
          )}
          {isObject && prop.properties && (
            <div className="pl-4 mt-2 border-l border-brass/20">
              {renderSchemaProperties(prop.properties, prop.required || [], `${prefix + key}.`)}
            </div>
          )}
          {isArray && prop.items && prop.items.properties && (
            <div className="pl-4 mt-2 border-l border-brass/20">
              <div className="text-xs text-brass/60 font-mono mb-2">Array Item properties:</div>
              {renderSchemaProperties(prop.items.properties, prop.items.required || [], `${prefix + key}[].`)}
            </div>
          )}
        </div>
      );
    });
  };

  // Fast Regex Code Syntax Highlighter
  const renderHighlightedCode = (code: string, language: string) => {
    if (!code) return "";
    let safe = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (language === "json") {
      safe = safe.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
          let cls = "text-purple-400";
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = "text-[#C89A4B] font-bold";
            } else {
              cls = "text-emerald-400";
            }
          } else if (/true|false/.test(match)) {
            cls = "text-sky-400 font-semibold";
          } else if (/null/.test(match)) {
            cls = "text-slate-400 italic";
          }
          if (cls === "text-[#C89A4B] font-bold") {
            return `<span class="${cls}">${match.slice(0, -1)}</span>:`;
          }
          return `<span class="${cls}">${match}</span>`;
        }
      );
    } else if (language === "curl") {
      safe = safe
        .replace(/(curl|-X|-H|-d|\\)/g, '<span class="text-sky-400 font-bold">$1</span>')
        .replace(/("Authorization: [^"]*")/g, '<span class="text-amber-400 font-semibold">$1</span>')
        .replace(/("Content-Type: [^"]*")/g, '<span class="text-amber-400 font-semibold">$1</span>')
        .replace(/("https:\/\/[^"]*")/g, '<span class="text-emerald-400 font-medium">$1</span>');
    } else if (language === "node" || language === "python") {
      safe = safe
        .replace(/(\/\/.*|#.*)/g, '<span class="text-slate-400 italic">$1</span>')
        .replace(/\b(const|let|var|await|try|catch|function|import|from|requests|print|json)\b/g, '<span class="text-sky-400 font-bold">$1</span>')
        .replace(/("[^"]*"|'[^']*')/g, '<span class="text-emerald-400">$1</span>');
    }
    return <span dangerouslySetInnerHTML={{ __html: safe }} />;
  };

  return (
    <div className="min-h-screen bg-ink-bg text-paper flex flex-col font-sans transition-colors duration-200">
      {/* Universal Header with Brand Logo, Versioning, and Theme Switching */}
      <header className="h-16 border-b border-ink-border bg-ink-bg/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#34A853] flex items-center justify-center font-extrabold text-white shadow-md shadow-[#34A853]/20">
            S
          </div>
          <div>
            <span className="font-extrabold tracking-wider text-paper block text-sm">SCRYME LEDGER</span>
            <span className="text-[10px] text-brass uppercase tracking-widest font-bold">V3 API reference</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg border border-ink-border bg-ink-card text-light-text hover:text-paper hover:bg-ink-bg transition-all duration-200 cursor-pointer"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-paper hover:text-brass transition-colors lg:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {/* Sidebar Left Column */}
        <aside
          className={`fixed inset-y-16 lg:inset-y-0 left-0 w-80 bg-ink-bg border-r border-ink-border overflow-y-auto z-40 transition-transform duration-300 transform
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:h-[calc(100vh-64px)] flex flex-col`}
        >
          {/* Search Box */}
          <div className="p-4 border-b border-ink-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-light-text" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search specs (Press '/' or '⌘K')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-ink-card text-paper pl-9 pr-8 py-2 rounded-lg border border-ink-border focus:outline-none focus:border-brass text-xs transition-colors placeholder-light-text/60"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-light-text hover:text-paper"
                >
                  <X size={14} />
                </button>
              ) : (
                <span className="absolute right-2.5 top-2.5 bg-ink-bg border border-ink-border text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-light-text">
                  /
                </span>
              )}
            </div>
          </div>

          {/* Expand/Collapse All controls */}
          <div className="px-4 py-2 flex items-center justify-between text-[10px] font-bold text-light-text uppercase tracking-wider border-b border-ink-border/20">
            <span>Navigation</span>
            <div className="flex gap-2">
              <button onClick={expandAllGroups} className="hover:text-brass cursor-pointer">Expand All</button>
              <span>•</span>
              <button onClick={collapseAllGroups} className="hover:text-brass cursor-pointer">Collapse All</button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Core Pinned Customization Guide */}
            {showGuideInSearch && (
              <div className="space-y-1">
                <span className="text-[10px] text-brass uppercase tracking-widest font-black px-2 block mb-1">Guides</span>
                <button
                  onClick={() => {
                    setActiveEndpointId("cms-customization-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-left text-xs transition-all duration-200 cursor-pointer ${
                    activeEndpointId === "cms-customization-guide"
                      ? "bg-brass/20 text-paper font-semibold border-l-2 border-brass"
                      : "text-light-text hover:text-paper hover:bg-ink-card"
                  }`}
                >
                  <BookOpen size={14} className="text-brass animate-pulse" />
                  <span className="font-bold truncate">CMS Customization Engine</span>
                </button>
              </div>
            )}

            <div className="border-t border-ink-border/40 my-2" />

            <span className="text-[10px] text-brass uppercase tracking-widest font-black px-2 block">API References</span>

            {Object.entries(filteredTagGroups).map(([tag, eps]) => {
              const isExpanded = !!expandedGroups[tag];
              const epCount = eps.length;
              return (
                <div key={tag} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(tag)}
                    className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-brass py-1 px-2 hover:text-paper rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="truncate pr-2">{tag.replace("V3 ", "")}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="bg-ink-card text-light-text text-[9px] px-1.5 py-0.5 rounded-full border border-ink-border font-mono">{epCount}</span>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
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
                            className={`w-full flex items-center gap-2 py-1.5 px-3 rounded-lg text-left text-xs transition-all duration-200 cursor-pointer ${
                              isActive
                                ? "bg-brass/15 text-paper font-semibold border-l-2 border-brass"
                                : "text-light-text hover:text-paper hover:bg-ink-card"
                            }`}
                          >
                            <span
                              className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono shrink-0 ${
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
          <div className="p-4 border-t border-ink-border text-[10px] text-light-text/60 flex items-center justify-between transition-colors duration-200">
            <span>Server Status: <span className="text-[#34A853] font-semibold">Online</span></span>
            <span>v3.0.0</span>
          </div>
        </aside>

        {/* Content Wrapper (Middle + Right columns) */}
        <main className="flex-1 lg:grid lg:grid-cols-12 min-h-[calc(100vh-64px)]">

          {/* MIDDLE COLUMN */}
          <section className="col-span-7 p-6 lg:p-12 overflow-y-auto space-y-10 border-r border-ink-border/60 max-w-4xl flex flex-col justify-between transition-colors duration-200">
            <div className="space-y-10 flex-1">
              {activeEndpointId === "cms-customization-guide" ? (
                // --- GORGEOUS HIGH-FIDELITY CMS CUSTOMIZATION ENGINE RENDER VIEW ---
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-brass uppercase tracking-wider font-semibold mb-2">
                      <span>Developer Guide</span>
                      <span>&bull;</span>
                      <span>Storefront & Catalog CMS</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-paper leading-tight">
                      CMS Customization Engine
                    </h1>
                    <p className="text-light-text text-sm mt-2 leading-relaxed">
                      Scryme V3 powers highly customizable, media-rich catalogs using a flexible database column structure. This guide explains how third-party and headless storefront developers utilize the dynamic <code className="text-paper bg-ink-card px-1.5 py-0.5 border border-ink-border font-mono text-xs rounded">customFields</code> JSON payload to build exceptional storefront and booking experiences.
                    </p>
                  </div>

                  {/* Preset Selector buttons */}
                  <div className="bg-ink-card rounded-xl border border-ink-border p-4 space-y-3">
                    <span className="text-[10px] text-brass uppercase tracking-widest font-bold flex items-center gap-1">
                      <Sparkles size={12} />
                      <span>Instant Simulator Presets</span>
                    </span>
                    <p className="text-xs text-light-text">
                      Choose a product or service category preset to instantly populate the live interactive engine and preview how custom metadata structures translate.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => applyPreset("sourdough")}
                        className="bg-ink-bg border border-ink-border text-paper hover:border-brass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        🌾 Sourdough Masterclass
                      </button>
                      <button
                        onClick={() => applyPreset("banneton")}
                        className="bg-ink-bg border border-ink-border text-paper hover:border-brass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        🧺 Cane Banneton
                      </button>
                      <button
                        onClick={() => applyPreset("spa")}
                        className="bg-ink-bg border border-ink-border text-paper hover:border-brass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        💆‍♀️ Swedish Massage
                      </button>
                    </div>
                  </div>

                  {/* Conceptual Card */}
                  <div className="bg-ink-card/50 rounded-xl border border-ink-border p-5 space-y-3">
                    <div className="flex items-center gap-2 text-brass font-bold text-sm">
                      <Layers size={16} />
                      <span>Prisma JSON Column Mapping</span>
                    </div>
                    <p className="text-xs text-light-text leading-relaxed">
                      The <code className="text-paper">Product</code> and <code className="text-paper">Service</code> schemas each contain a schema-free nullable <code className="text-brass font-mono font-semibold">customFields</code> field. This layout completely bypasses rigid database structures, permitting organizations to serialize rich-media elements, Markdown descriptions, SEO details, and custom technical specification attributes without database schema migrations.
                    </p>
                  </div>

                  {/* Main Customize Parameters Section */}
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">CMS Payload Specifications</h2>

                    {/* 1. markdownDescription */}
                    <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-paper font-black text-sm">markdownDescription</span>
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">string</span>
                      </div>
                      <p className="text-xs text-light-text leading-relaxed">
                        Accepts GitHub Flavored Markdown (GFM) formatting. Headless storefronts parse this dynamically to output formatted guides, rich tables, blockquotes, and lists for services or product details.
                      </p>
                    </div>

                    {/* 2. images */}
                    <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-paper font-black text-sm">images</span>
                        <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">array of objects</span>
                      </div>
                      <p className="text-xs text-light-text leading-relaxed">
                        Ordered gallery of uploaded image assets. The primary image is defined at index <code className="text-paper font-mono">0</code>.
                      </p>
                      <div className="bg-ink-card rounded-lg border border-ink-border p-3 text-xs font-mono space-y-1.5">
                        <div className="text-paper font-bold pb-1 border-b border-ink-border/60 text-[10px] uppercase text-brass">ImageItem Schema:</div>
                        <div>• <span className="text-paper font-bold">id</span> (string): Unique image ID (crucial for react rendering keys).</div>
                        <div>• <span className="text-paper font-bold">url</span> (string): Absolute URL to CDN image asset.</div>
                        <div>• <span className="text-paper font-bold">caption</span> (string): Alt text for accessibility and crawl performance.</div>
                      </div>
                    </div>

                    {/* 3. seo */}
                    <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-paper font-black text-sm">seo</span>
                        <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">object</span>
                      </div>
                      <p className="text-xs text-light-text leading-relaxed">
                        Custom HTML page headers to override default metadata tags dynamically.
                      </p>
                      <div className="bg-ink-card rounded-lg border border-ink-border p-3 text-xs font-mono space-y-1.5">
                        <div className="text-paper font-bold pb-1 border-b border-ink-border/60 text-[10px] uppercase text-brass">Seo Schema:</div>
                        <div>• <span className="text-paper font-bold">title</span> (string): Custom browser tab title. Max 60 chars.</div>
                        <div>• <span className="text-paper font-bold">description</span> (string): Search card snippet. Max 160 chars.</div>
                        <div>• <span className="text-paper font-bold">keywords</span> (string): Comma-separated tag phrases.</div>
                      </div>
                    </div>

                    {/* 4. customAttributes */}
                    <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-paper font-black text-sm">customAttributes</span>
                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">object (dictionary)</span>
                      </div>
                      <p className="text-xs text-light-text leading-relaxed">
                        Key-value map representing dynamic parameters. This supports advanced faceted filters in storefront lists (e.g. searching items filtered by <code className="text-paper">difficulty</code> or <code className="text-paper">material</code>) without rigid database specifications. Keys must be strictly <code className="text-paper">snake_case</code> or <code className="text-paper">lowercase</code>.
                      </p>
                    </div>

                    {/* eCommerce Controls */}
                    <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-4">
                      <div className="flex items-center gap-2 font-bold text-paper text-sm pb-1.5 border-b border-ink-border/40">
                        <Workflow size={16} className="text-brass" />
                        <span>Product Specific eCommerce Lifecycle Options</span>
                      </div>
                      <div className="divide-y divide-ink-border/60 text-xs">
                        <div className="py-2.5 flex items-baseline justify-between gap-2">
                          <div>
                            <code className="text-paper font-bold">publishStatus</code>
                            <span className="text-light-text block text-[10px]">Values: Draft | Published | Scheduled | Archived</span>
                          </div>
                          <span className="text-brass font-semibold text-[10px] font-mono">string</span>
                        </div>
                        <div className="py-2.5 flex items-baseline justify-between gap-2">
                          <div>
                            <code className="text-paper font-bold">publishedAt</code>
                            <span className="text-light-text block text-[10px]">ISO timestamp of release schedule</span>
                          </div>
                          <span className="text-brass font-semibold text-[10px] font-mono">ISO8601 string / null</span>
                        </div>
                        <div className="py-2.5 flex items-baseline justify-between gap-2">
                          <div>
                            <code className="text-paper font-bold">layoutTemplate</code>
                            <span className="text-light-text block text-[10px]">Visual layout style token for the headless portal</span>
                          </div>
                          <span className="text-brass font-semibold text-[10px] font-mono">string</span>
                        </div>
                        <div className="py-2.5 flex items-baseline justify-between gap-2">
                          <div>
                            <code className="text-paper font-bold">customSlugOverride</code>
                            <span className="text-light-text block text-[10px]">Targeted override of SEO friendly URL slugs</span>
                          </div>
                          <span className="text-brass font-semibold text-[10px] font-mono">string</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Storefront Live Simulator Form */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">Custom CMS Field Controls</h2>
                    <p className="text-xs text-light-text">
                      Modify the CMS fields below dynamically to see how they rebuild the request payload and simulated customer-facing UI card on the right.
                    </p>

                    <div className="bg-ink-card border border-ink-border rounded-xl p-5 space-y-4 shadow-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-brass">Name</label>
                          <input
                            type="text"
                            value={simName}
                            onChange={(e) => setSimName(e.target.value)}
                            className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-brass">SKU Code</label>
                          <input
                            type="text"
                            value={simSku}
                            onChange={(e) => setSimSku(e.target.value)}
                            className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-brass">Price ($)</label>
                          <input
                            type="number"
                            value={simPrice}
                            onChange={(e) => setSimPrice(Number(e.target.value))}
                            className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-brass">SEO Title Override</label>
                          <input
                            type="text"
                            value={simSeoTitle}
                            onChange={(e) => setSimSeoTitle(e.target.value)}
                            className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brass">Primary Image Asset URL</label>
                        <input
                          type="text"
                          value={simImageUrl}
                          onChange={(e) => setSimImageUrl(e.target.value)}
                          className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-brass">SEO Description</label>
                          <input
                            type="text"
                            value={simSeoDesc}
                            onChange={(e) => setSimSeoDesc(e.target.value)}
                            className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-brass">Attribute: instructor_name</label>
                          <input
                            type="text"
                            value={simAttrValue}
                            onChange={(e) => setSimAttrValue(e.target.value)}
                            className="w-full bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper focus:outline-none focus:border-brass"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brass">markdownDescription (supports standard Markdown syntax)</label>
                        <textarea
                          value={simMarkdown}
                          onChange={(e) => setSimMarkdown(e.target.value)}
                          className="w-full h-28 bg-ink-bg border border-ink-border rounded px-3 py-2 text-xs text-paper font-mono focus:outline-none focus:border-brass resize-y"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeEndpoint ? (
                // --- STANDARD ENDPOINT DETAILED VIEW WITH BEAUTIFUL HIGH-END INTERACTIVE TABS ---
                <div className="space-y-8">
                  {/* Header Information */}
                  <div>
                    <div className="flex items-center gap-3 text-xs text-brass uppercase tracking-wider font-semibold mb-2">
                      <span>API Reference</span>
                      <span>&bull;</span>
                      <span>{activeEndpoint.tag}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-paper leading-tight">
                      {activeEndpoint.summary}
                    </h1>
                  </div>

                  {/* Tabs: Reference, Playground, Schema */}
                  <div className="flex border-b border-ink-border">
                    <button
                      onClick={() => setActiveDocTab("reference")}
                      className={`px-5 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all duration-150 ${
                        activeDocTab === "reference"
                          ? "border-brass text-paper font-black"
                          : "border-transparent text-light-text hover:text-paper"
                      }`}
                    >
                      Reference
                    </button>
                    <button
                      onClick={() => setActiveDocTab("playground")}
                      className={`px-5 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all duration-150 flex items-center gap-1.5 ${
                        activeDocTab === "playground"
                          ? "border-brass text-paper font-black"
                          : "border-transparent text-light-text hover:text-paper"
                      }`}
                    >
                      <Play size={12} className="text-brass" />
                      Playground / Try It
                    </button>
                    <button
                      onClick={() => setActiveDocTab("schema")}
                      className={`px-5 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all duration-150 ${
                        activeDocTab === "schema"
                          ? "border-brass text-paper font-black"
                          : "border-transparent text-light-text hover:text-paper"
                      }`}
                    >
                      JSON Schema
                    </button>
                  </div>

                  {activeDocTab === "reference" && (
                    <div className="space-y-8 animate-fade-in">
                      {/* HTTP Endpoint Tag & Path */}
                      <div className="bg-ink-card rounded-xl border border-ink-border p-4 flex flex-wrap items-center justify-between gap-4">
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
                          <code className="text-paper font-mono text-sm break-all font-bold">
                            {getDynamicUrl(activeEndpoint.path)}
                          </code>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-light-text bg-ink-bg px-3 py-1.5 rounded-lg border border-ink-border">
                          <Lock size={12} className="text-brass" />
                          <span className="font-mono">Bearer Token</span>
                        </div>
                      </div>

                      {/* Description */}
                      {activeEndpoint.description && (
                        <div className="space-y-2">
                          <h2 className="text-sm uppercase tracking-widest font-black text-brass">Description</h2>
                          <p className="text-light-text text-sm leading-relaxed whitespace-pre-line bg-ink-card/30 p-4 rounded-xl border border-ink-border/40">
                            {activeEndpoint.description}
                          </p>
                        </div>
                      )}

                      {/* Path/Query Parameters */}
                      {activeEndpoint.parameters && activeEndpoint.parameters.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-sm uppercase tracking-widest font-black text-brass">Parameters</h2>
                          <div className="border border-ink-border rounded-xl bg-ink-card/55 p-4 divide-y divide-ink-border/60">
                            {activeEndpoint.parameters.map((param: any) => (
                              <div key={param.name} className="py-3 first:pt-0 last:pb-0 text-sm">
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <span className="font-mono text-paper font-bold">{param.name}</span>
                                  <span className="text-brass text-xs font-mono font-semibold">
                                    {param.schema?.type || "string"}
                                  </span>
                                  <span className="bg-ink-bg text-light-text text-[10px] font-mono px-1.5 py-0.5 rounded border border-ink-border uppercase">
                                    {param.in}
                                  </span>
                                  {param.required && (
                                    <span className="text-red-400 text-[10px] font-mono uppercase font-bold tracking-wider">
                                      required
                                    </span>
                                  )}
                                </div>
                                {param.description && (
                                  <p className="text-light-text mt-1 text-xs leading-relaxed">{param.description}</p>
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
                            <h2 className="text-sm uppercase tracking-widest font-black text-brass">
                              Request Body
                            </h2>
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                              json
                            </span>
                          </div>

                          <div className="border border-ink-border rounded-xl bg-ink-card/55 p-4">
                            {requestBodySchema.properties ? (
                              <div className="divide-y divide-ink-border/60">
                                {renderSchemaProperties(requestBodySchema.properties, requestBodySchema.required || [])}
                              </div>
                            ) : (
                              <p className="text-light-text text-xs font-mono">Any valid JSON object</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDocTab === "playground" && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-yellow-500/10 text-yellow-500/90 border border-yellow-500/20 rounded-xl p-4 text-xs leading-relaxed">
                        💡 <strong>Interactive Sandbox mode:</strong> Fill in parameters below to rebuild headers, query filters, JSON payloads, and dynamic code snippets in real-time. Hit <strong>"Send Request"</strong> to mock real API cycles.
                      </div>

                      {/* Parameters Form Inputs */}
                      {activeEndpoint.parameters && activeEndpoint.parameters.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs uppercase tracking-widest font-bold text-brass">Query & Path Params</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-ink-card/40 border border-ink-border p-4 rounded-xl">
                            {activeEndpoint.parameters.map((param: any) => (
                              <div key={param.name} className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-paper flex items-center justify-between">
                                  <span>{param.name} {param.required && <span className="text-red-400 font-black">*</span>}</span>
                                  <span className="text-brass font-mono text-[9px]">{param.in}</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder={`Enter ${param.name}...`}
                                  value={playgroundParams[param.name] || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPlaygroundParams((prev) => ({ ...prev, [param.name]: val }));
                                  }}
                                  className="w-full bg-ink-bg border border-ink-border rounded px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:border-brass"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Request Body Fields Editor */}
                      {requestBodySchema && requestBodySchema.properties && (
                        <div className="space-y-3">
                          <h3 className="text-xs uppercase tracking-widest font-bold text-brass">Request Payload Fields</h3>
                          <div className="bg-ink-card/40 border border-ink-border p-4 rounded-xl space-y-3">
                            {Object.entries(requestBodySchema.properties).map(([key, prop]: [string, any]) => {
                              const isRequired = requestBodySchema.required?.includes(key);
                              const currentVal = playgroundBody[key];

                              return (
                                <div key={key} className="space-y-1 text-xs">
                                  <label className="font-bold text-paper flex items-baseline justify-between">
                                    <span>{key} {isRequired && <span className="text-red-400">*</span>}</span>
                                    <span className="text-brass/80 font-mono text-[9px]">{prop.type || "string"}</span>
                                  </label>
                                  {prop.type === "boolean" ? (
                                    <select
                                      value={String(!!currentVal)}
                                      onChange={(e) => {
                                        const boolVal = e.target.value === "true";
                                        setPlaygroundBody((prev) => ({ ...prev, [key]: boolVal }));
                                      }}
                                      className="w-full bg-ink-bg border border-ink-border rounded px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:border-brass"
                                    >
                                      <option value="true">true</option>
                                      <option value="false">false</option>
                                    </select>
                                  ) : prop.type === "number" || prop.type === "integer" ? (
                                    <input
                                      type="number"
                                      value={currentVal === undefined ? "" : Number(currentVal)}
                                      onChange={(e) => {
                                        const numVal = e.target.value === "" ? "" : Number(e.target.value);
                                        setPlaygroundBody((prev) => ({ ...prev, [key]: numVal }));
                                      }}
                                      className="w-full bg-ink-bg border border-ink-border rounded px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:border-brass"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={currentVal === undefined ? "" : String(currentVal)}
                                      onChange={(e) => {
                                        const txtVal = e.target.value;
                                        setPlaygroundBody((prev) => ({ ...prev, [key]: txtVal }));
                                      }}
                                      className="w-full bg-ink-bg border border-ink-border rounded px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:border-brass"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Playground Send Action Button */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={sendSimulatedRequest}
                          disabled={isPlayingLoading}
                          className="bg-brass hover:bg-white text-ink-bg font-black uppercase text-xs px-5 py-3 tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isPlayingLoading ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              Send Simulated Request
                            </>
                          )}
                        </button>
                      </div>

                      {/* Playground Response Block */}
                      {playgroundResponse && (
                        <div className="space-y-2.5 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs uppercase tracking-widest font-black text-brass">Playground API Response</h4>
                            <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                              200 OK (simulated)
                            </span>
                          </div>
                          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl">
                            <button
                              onClick={() => handleCopy(JSON.stringify(playgroundResponse, null, 2), "playground-resp")}
                              className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              {copiedMap["playground-resp"] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                            <pre className="overflow-x-auto text-green-400 whitespace-pre leading-relaxed scrollbar-thin max-h-96">
                              <code>{renderHighlightedCode(JSON.stringify(playgroundResponse, null, 2), "json")}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDocTab === "schema" && (
                    <div className="space-y-4 animate-fade-in">
                      <h3 className="text-xs uppercase tracking-widest font-bold text-brass">Raw OpenAPI Response Schema definition</h3>
                      <p className="text-xs text-light-text">Below is the complete raw model representation parsed dynamically from our central specification files.</p>
                      <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl">
                        <button
                          onClick={() => handleCopy(JSON.stringify(activeEndpoint.responses, null, 2), "raw-schema")}
                          className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 animate-fade-in"
                        >
                          {copiedMap["raw-schema"] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                        <pre className="overflow-x-auto text-purple-300 whitespace-pre leading-relaxed scrollbar-thin max-h-[500px]">
                          <code>{renderHighlightedCode(JSON.stringify(activeEndpoint.responses, null, 2), "json")}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <BookOpen size={48} className="text-brass mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold">Select an API Endpoint</h3>
                  <p className="text-light-text text-sm mt-2">Explore Scryme Ledger's high-performance endpoints from the left navigation.</p>
                </div>
              )}
            </div>

            {/* Pagination Controls at Bottom */}
            <div className="mt-12 pt-6 border-t border-ink-border/60 flex items-center justify-between text-xs font-bold text-light-text select-none">
              <button
                onClick={handlePrevPage}
                disabled={currentChronoIndex === 0}
                className="flex items-center gap-1.5 bg-ink-card hover:bg-ink-bg px-4 py-2 rounded-lg border border-ink-border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-paper"
              >
                <ArrowLeft size={14} />
                <span>Prev Page</span>
              </button>

              <div className="text-[10px] text-light-text/60 font-mono">
                {currentChronoIndex + 1} / {chronologicalList.length}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentChronoIndex === chronologicalList.length - 1}
                className="flex items-center gap-1.5 bg-ink-card hover:bg-ink-bg px-4 py-2 rounded-lg border border-ink-border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-paper"
              >
                <span>Next Page</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <section className="col-span-5 bg-[#080d17] p-6 lg:p-12 overflow-y-auto space-y-8 sticky top-0 lg:h-[calc(100vh-64px)] flex flex-col justify-between border-t lg:border-t-0 border-ink-border">
            <div className="space-y-6 flex-1">

              {/* CMS Target / Tabs Selector (Only for Guide) */}
              {activeEndpointId === "cms-customization-guide" ? (
                <div className="space-y-6">
                  {/* Service vs Product Schema Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-ink-border pb-3">
                      <span className="text-[10px] font-black uppercase text-light-text tracking-widest flex items-center gap-1">
                        <Fingerprint size={12} className="text-brass" />
                        <span>CMS Target Type</span>
                      </span>
                      <div className="bg-ink-card p-0.5 border border-ink-border rounded flex gap-1">
                        <button
                          onClick={() => setSelectedCmsTarget("service")}
                          className={`text-[9px] font-mono font-bold uppercase px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                            selectedCmsTarget === "service" ? "bg-brass text-ink-bg" : "text-light-text hover:text-paper"
                          }`}
                        >
                          Service Schema
                        </button>
                        <button
                          onClick={() => setSelectedCmsTarget("product")}
                          className={`text-[9px] font-mono font-bold uppercase px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                            selectedCmsTarget === "product" ? "bg-brass text-ink-bg" : "text-light-text hover:text-paper"
                          }`}
                        >
                          Product Schema
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Simulator Preview Switcher Tabs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest font-black text-brass">Storefront Output</span>
                      <div className="bg-ink-card p-0.5 border border-ink-border rounded flex gap-1">
                        <button
                          onClick={() => setCmsPreviewTab("preview")}
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-1 transition-colors cursor-pointer rounded ${
                            cmsPreviewTab === "preview" ? "bg-brass text-ink-bg" : "text-light-text"
                          }`}
                        >
                          Live Card Preview
                        </button>
                        <button
                          onClick={() => setCmsPreviewTab("payload")}
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-1 transition-colors cursor-pointer rounded ${
                            cmsPreviewTab === "payload" ? "bg-brass text-ink-bg" : "text-light-text"
                          }`}
                        >
                          Serialized JSON
                        </button>
                      </div>
                    </div>

                    {cmsPreviewTab === "preview" ? (
                      /* Live Simulated Storefront Card Preview */
                      <div className="bg-ink-bg border border-ink-border rounded-xl overflow-hidden flex flex-col justify-between shadow-xl animate-fade-in text-left">
                        {/* Browser window top bar */}
                        <div className="bg-ink-card border-b border-ink-border px-3 py-2 flex items-center gap-1.5 text-[10px] text-light-text font-mono">
                          <Globe size={11} className="text-brass" />
                          <span className="truncate">{simSeoTitle || "Storefront Browser Tab"}</span>
                        </div>

                        <div className="relative aspect-video bg-ink-card">
                          <img
                            src={simImageUrl}
                            alt="Simulated storefront cover"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600";
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-4 pt-10">
                            <span className="text-[8px] font-black uppercase tracking-widest text-brass">
                              {selectedCmsTarget === "service" ? "Premium Service Booking" : "Retail Catalog Item"}
                            </span>
                            <h4 className="text-sm font-bold text-white truncate">{simName || "Unnamed Custom Item"}</h4>
                            <div className="flex items-center justify-between mt-1 text-white">
                              <span className="text-[10px] text-zinc-400 font-mono">{simSku || "N/A"}</span>
                              <span className="text-xs font-black text-brass">${simPrice}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Custom attributes tag */}
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-ink-card border border-ink-border text-light-text px-2 py-0.5 rounded text-[10px] font-mono">
                              instructor: <span className="text-paper font-semibold">{simAttrValue}</span>
                            </span>
                          </div>

                          {/* SEO Tag information preview snippet */}
                          <div className="bg-zinc-950/40 p-2.5 rounded border border-ink-border text-[10px] text-light-text space-y-1">
                            <strong className="text-brass text-[9px] font-bold uppercase block">Google Search Preview:</strong>
                            <div className="text-blue-400 hover:underline truncate font-semibold">{simSeoTitle}</div>
                            <div className="line-clamp-2 text-zinc-400 leading-relaxed">{simSeoDesc}</div>
                          </div>

                          {/* Parsed Markdown block */}
                          <div className="border border-ink-border/60 p-3 rounded bg-ink-card/45 text-[11px] leading-relaxed text-light-text max-h-24 overflow-y-auto scrollbar-thin">
                            <strong className="text-white block font-bold text-xs mb-1">Storefront About / Specifications (MD)</strong>
                            <p className="whitespace-pre-line text-xs font-sans">{simMarkdown}</p>
                          </div>

                          <button className="w-full bg-brass text-ink-bg font-black uppercase text-[10px] py-2.5 tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer rounded">
                            {selectedCmsTarget === "service" ? "Reserve Available Slot" : "Add Catalog Item to Cart"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Serialized customFields JSON view */
                      <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl animate-fade-in text-left">
                        <button
                          onClick={() => {
                            const payload = {
                              markdownDescription: simMarkdown,
                              images: [{ id: "img_cms_primary", url: simImageUrl, caption: simName }],
                              seo: { title: simSeoTitle, description: simSeoDesc, keywords: "baking, premium" },
                              customAttributes: { instructor_name: simAttrValue }
                            };
                            handleCopy(JSON.stringify(payload, null, 2), "cms-raw-payload");
                          }}
                          className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          {copiedMap["cms-raw-payload"] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                        <pre className="overflow-x-auto text-green-300 whitespace-pre leading-relaxed scrollbar-thin max-h-96">
                          <code>
                            {renderHighlightedCode(JSON.stringify({
                              markdownDescription: simMarkdown,
                              images: [
                                {
                                  id: "img_cms_primary",
                                  url: simImageUrl,
                                  caption: simName
                                }
                              ],
                              seo: {
                                title: simSeoTitle,
                                description: simSeoDesc,
                                keywords: "baking, premium"
                              },
                              customAttributes: {
                                instructor_name: simAttrValue
                              }
                            }, null, 2), "json")}
                          </code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Target / Request Snippet Block */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-brass">
                    <Code size={14} />
                    <span>Request Snippet</span>
                  </div>
                  {/* Language Tab buttons */}
                  <div className="bg-ink-card rounded-lg p-1 border border-ink-border flex gap-1">
                    {(["curl", "node", "python"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLanguage(lang)}
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded transition-colors cursor-pointer ${
                          codeLanguage === lang ? "bg-brass text-ink-bg" : "text-light-text hover:text-paper"
                        }`}
                      >
                        {lang === "curl" ? "cURL" : lang === "node" ? "Node" : "Python"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl text-left">
                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(codeSnippets[codeLanguage], "request")}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    {copiedMap["request"] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>

                  <pre className="overflow-x-auto text-paper whitespace-pre leading-relaxed select-all scrollbar-thin max-h-96">
                    <code>{renderHighlightedCode(codeSnippets[codeLanguage], codeLanguage)}</code>
                  </pre>
                </div>
              </div>

              {/* Response Block (Only for non-guide/standard endpoints reference view) */}
              {activeEndpointId !== "cms-customization-guide" && activeDocTab === "reference" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-brass">
                      <Terminal size={14} />
                      <span>Response Payload</span>
                    </div>
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
                      200 ok
                    </span>
                  </div>

                  <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl text-left">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(JSON.stringify(mockResponsePayload, null, 2), "response")}
                      className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 animate-fade-in"
                    >
                      {copiedMap["response"] ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>

                    <pre className="overflow-x-auto text-green-300 whitespace-pre leading-relaxed scrollbar-thin max-h-[350px]">
                      <code>
                        {renderHighlightedCode(JSON.stringify(mockResponsePayload, null, 2), "json")}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper Docs */}
            <div className="pt-6 border-t border-ink-border/60 hidden lg:block transition-colors duration-200">
              <div className="bg-ink-card/40 border border-ink-border/60 rounded-xl p-4 text-xs space-y-2 text-left">
                <div className="font-bold text-brass flex items-center gap-1">
                  <Fingerprint size={12} />
                  <span>Sandbox Credentials</span>
                </div>
                <p className="text-light-text leading-relaxed">
                  Use the <code className="text-paper">/v3/auth/token</code> endpoint in sandbox mode to exchange client credentials. All write operations require a valid organization scope.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
