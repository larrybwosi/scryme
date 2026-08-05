// App.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Copy,
  Check,
  Terminal,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Code,
  Lock,
  Menu,
  X,
  Workflow,
  RefreshCw,
  Sun,
  Moon,
  Play,
  Send,
  ArrowLeft,
  ArrowRight,
  Fingerprint,
} from "lucide-react";
import openapiSpec from "./openapi.json";
import CmsCustomizationGuide, {
  PRESETS,
  type CmsSimulatorState,
} from "./components/CmsCustomizationGuide";
import GlobalResponseGuide from "./components/GlobalResponseGuide";

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

// Shared method badge styling — used in sidebar + detail header
const methodStyles: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  PATCH: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  DELETE: "bg-rose-500/10 text-rose-400 border-rose-500/25",
};

const methodBadge = (method: string) =>
  methodStyles[method] || "bg-slate-500/10 text-slate-400 border-slate-500/25";

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
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "node" | "python">(
    "curl",
  );
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  // Playground & Interactive Tabs State
  const [activeDocTab, setActiveDocTab] = useState<
    "reference" | "playground" | "schema"
  >("reference");
  const [playgroundParams, setPlaygroundParams] = useState<
    Record<string, string>
  >({});
  const [playgroundBody, setPlaygroundBody] = useState<Record<string, any>>({});
  const [isPlayingLoading, setIsPlayingLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);

  // CMS Guide Pinned Navigation State
  const [selectedCmsTarget, setSelectedCmsTarget] = useState<
    "service" | "product"
  >("service");

  // CMS Simulator State (Defaults to sourdough)
  const [simState, setSimState] = useState<CmsSimulatorState>({
    name: PRESETS.sourdough.name,
    sku: PRESETS.sourdough.sku,
    price: PRESETS.sourdough.price,
    markdownDescription: PRESETS.sourdough.markdownDescription,
    imageUrl: PRESETS.sourdough.imageUrl,
    seoTitle: PRESETS.sourdough.seoTitle,
    seoDesc: PRESETS.sourdough.seoDesc,
    instructor: PRESETS.sourdough.instructor,
  });

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
        if (methodKey === "parameters") continue;

        const tags = methodObj.tags || ["General"];
        const primaryTag = tags[0];

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
      setExpandedGroups(tags.reduce((acc, t) => ({ ...acc, [t]: true }), {}));
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
          ep.method.toLowerCase().includes(query),
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
      "customattributes".includes(query) ||
      "global response".includes(query) ||
      "response structure".includes(query) ||
      "v3 global".includes(query)
    );
  }, [searchQuery]);

  const activeEndpoint = useMemo(() => {
    return (
      endpoints.find((ep) => ep.operationId === activeEndpointId) ||
      endpoints[0]
    );
  }, [endpoints, activeEndpointId]);

  // Initialize playground fields when active endpoint changes
  useEffect(() => {
    if (
      activeEndpoint &&
      activeEndpointId !== "cms-customization-guide" &&
      activeEndpointId !== "v3-global-response-guide"
    ) {
      const defaultParams: Record<string, string> = {};
      activeEndpoint.parameters?.forEach((p) => {
        if (p.name === "orgSlug") {
          defaultParams[p.name] = "bakery-co";
        } else {
          defaultParams[p.name] = p.schema?.default || "";
        }
      });
      setPlaygroundParams(defaultParams);

      const resolved = resolveSchema(
        activeEndpoint.requestBody?.content?.["application/json"]?.schema,
      );
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
  const resolveSchema = (
    schema: any,
    visited = new Set<string>(),
    depth = 0,
  ): any => {
    if (!schema || depth > 8) return null;
    if (schema.$ref) {
      const refName = schema.$ref.split("/").pop();
      if (refName) {
        if (visited.has(refName)) {
          return {
            type: "object",
            description: `Circular reference to ${refName}`,
          };
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
      return {
        ...schema,
        items: resolveSchema(schema.items, visited, depth + 1),
      };
    }
    return schema;
  };

  // Mock JSON payload builder with recursion limit and cycle detection
  const generateMockFromSchema = (
    schema: any,
    depth = 0,
    visitedRefs = new Set<string>(),
  ): any => {
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
      const childMock = generateMockFromSchema(
        schema.items,
        depth + 1,
        visitedRefs,
      );
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

  // Handle CMS simulator field changes
  const handleSimStateChange = (
    field: keyof CmsSimulatorState,
    value: string | number,
  ) => {
    setSimState((prev) => ({ ...prev, [field]: value }));
  };

  // Apply simulator presets
  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const data = PRESETS[presetKey];
    setSimState({
      name: data.name,
      sku: data.sku,
      price: data.price,
      markdownDescription: data.markdownDescription,
      seoTitle: data.seoTitle,
      seoDesc: data.seoDesc,
      imageUrl: data.imageUrl,
      instructor: data.instructor,
    });
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
    if (
      activeEndpointId === "cms-customization-guide" ||
      activeEndpointId === "v3-global-response-guide"
    )
      return null;
    if (activeDocTab === "playground") {
      return playgroundBody;
    }
    if (!activeEndpoint || !activeEndpoint.requestBody) return null;
    const content = activeEndpoint.requestBody.content;
    const jsonContent = content?.["application/json"];
    return jsonContent?.schema
      ? generateMockFromSchema(jsonContent.schema)
      : null;
  }, [activeEndpoint, activeDocTab, playgroundBody, activeEndpointId]);

  // Extract Mock Response payload
  const mockResponsePayload = useMemo(() => {
    if (!activeEndpoint) return null;
    const successResponse =
      activeEndpoint.responses?.["200"] || activeEndpoint.responses?.["201"];
    if (!successResponse) return { success: true };
    const content = successResponse.content;
    const jsonContent = content?.["application/json"];
    return jsonContent?.schema
      ? generateMockFromSchema(jsonContent.schema)
      : { success: true };
  }, [activeEndpoint]);

  // Dynamic URL with path variables and query parameters populated
  const getDynamicUrl = (path: string) => {
    let finalPath = path;
    const queryParams: string[] = [];

    Object.entries(playgroundParams).forEach(([key, val]) => {
      const isPath = path.includes(`{${key}}`);
      if (isPath) {
        finalPath = finalPath.replace(`{${key}}`, val || `{${key}}`);
      } else if (val) {
        queryParams.push(`${key}=${encodeURIComponent(val)}`);
      }
    });

    if (queryParams.length > 0) {
      return `${finalPath}?${queryParams.join("&")}`;
    }
    return finalPath;
  };

  // Generate dynamic Code Snippets
  const codeSnippets = useMemo(() => {
    const rawApiUrl = import.meta.env.VITE_API_URL || "https://api.scryme.tech";
    const normalizedApiUrl = rawApiUrl.endsWith("/")
      ? rawApiUrl.slice(0, -1)
      : rawApiUrl;

    if (activeEndpointId === "v3-global-response-guide") {
      const targetUrl = `${normalizedApiUrl}/v3/bakery-co/inventory?locationId=loc_main`;
      const targetMethod = "GET";

      let curl = `curl -X ${targetMethod} "${targetUrl}" \\\n  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json"`;

      let node = `// Node.js Fetch Code\nconst url = "${targetUrl}";\nconst options = {\n  method: "${targetMethod}",\n  headers: {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n  }\n};\n\ntry {\n  const response = await fetch(url, options);\n  const data = await response.json();\n  console.log(data); // Expect wrapped global response structure!\n} catch (error) {\n  console.error("Error:", error);\n}`;

      let python = `import requests\n\nurl = "${targetUrl}"\nheaders = {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json()) # Expect wrapped global response structure!`;

      return { curl, node, python };
    }

    if (activeEndpointId === "cms-customization-guide") {
      const baseUrl = `${normalizedApiUrl}/v3`;

      const targetPayload = {
        name: simState.name,
        sku: simState.sku,
        price: simState.price,
        customFields: {
          markdownDescription: simState.markdownDescription,
          images: [
            {
              id: "img_cms_primary",
              url: simState.imageUrl,
              caption: simState.name,
            },
          ],
          seo: {
            title: simState.seoTitle,
            description: simState.seoDesc,
            keywords: "baking, premium",
          },
          customAttributes: {
            instructor_name: simState.instructor,
          },
        },
      };

      const targetUrl =
        selectedCmsTarget === "service"
          ? `${baseUrl}/bakery-co/services/srv_sourdough_101`
          : `${baseUrl}/bakery-co/catalog/products/prod_proofing_basket`;
      const targetMethod = "PATCH";

      const bodyStr = JSON.stringify(targetPayload, null, 2);

      let curl = `curl -X ${targetMethod} "${targetUrl}" \\\n  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyStr.replace(/'/g, "'\\''")}'`;

      let node = `// Node.js Fetch Code\nconst url = "${targetUrl}";\nconst options = {\n  method: "${targetMethod}",\n  headers: {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${JSON.stringify(targetPayload, null, 2)})\n};\n\ntry {\n  const response = await fetch(url, options);\n  const data = await response.json();\n  console.log(data);\n} catch (error) {\n  console.error("Error:", error);\n}`;

      let python = `import requests\n\nurl = "${targetUrl}"\nheaders = {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n}\npayload = ${JSON.stringify(targetPayload, null, 4).replace(/true/g, "True").replace(/false/g, "False").replace(/null/g, "None")}\n\nresponse = requests.patch(url, json=payload, headers=headers)\nprint(response.json())`;

      return { curl, node, python };
    }

    if (!activeEndpoint) return { curl: "", node: "", python: "" };

    const baseUrl = normalizedApiUrl;
    const path = getDynamicUrl(activeEndpoint.path);
    const method = activeEndpoint.method;
    const fullUrl = `${baseUrl}${path}`;

    const bodyStr = mockRequestPayload
      ? JSON.stringify(mockRequestPayload, null, 2)
      : "";

    let curl = `curl -X ${method} "${fullUrl}" \\\n  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json"`;
    if (bodyStr) {
      curl += ` \\\n  -d '${bodyStr.replace(/'/g, "'\\''")}'`;
    }

    let node = `// Node.js Fetch Code\n`;
    node += `const url = "${fullUrl}";\n`;
    node += `const options = {\n  method: "${method}",\n  headers: {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n  }`;
    if (bodyStr) {
      node += `,\n  body: JSON.stringify(${JSON.stringify(mockRequestPayload, null, 2)})\n`;
    } else {
      node += `\n`;
    }
    node += `};\n\ntry {\n  const response = await fetch(url, options);\n  const data = await response.json();\n  console.log(data);\n} catch (error) {\n  console.error("Error:", error);\n}`;

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
  }, [
    activeEndpoint,
    mockRequestPayload,
    activeEndpointId,
    selectedCmsTarget,
    playgroundParams,
    playgroundBody,
    simState,
  ]);

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
      {
        id: "cms-customization-guide",
        type: "guide",
        name: "CMS Customization Engine",
      },
      {
        id: "v3-global-response-guide",
        type: "guide",
        name: "Global Response Structure",
      },
    ];
    endpoints.forEach((ep) => {
      list.push({
        id: ep.operationId,
        type: "api",
        name: ep.summary || ep.path,
      });
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
  const renderSchemaProperties = (
    properties: any,
    requiredList: string[] = [],
    prefix = "",
  ) => {
    if (!properties) return null;

    return Object.entries(properties).map(([key, prop]: [string, any]) => {
      const isRequired = requiredList.includes(key);
      const isObject = prop.type === "object";
      const isArray = prop.type === "array";

      return (
        <div
          key={prefix + key}
          className="py-3.5 border-b border-ink-border/50 last:border-b-0 text-sm"
        >
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="font-mono text-paper font-semibold text-[13px]">
              {prefix + key}
            </span>
            <span className="text-brass/90 text-[11px] font-mono font-medium tracking-wide">
              {prop.type || "any"}
            </span>
            {isRequired && (
              <span className="text-rose-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
                required
              </span>
            )}
          </div>
          {prop.description && (
            <p className="text-light-text mt-1.5 text-xs leading-relaxed">
              {prop.description}
            </p>
          )}
          {prop.enum && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-brass/70 text-[10px] font-mono font-semibold uppercase tracking-wide">
                Allowed
              </span>
              {prop.enum.map((val: string) => (
                <span
                  key={val}
                  className="bg-ink-bg text-light-text px-1.5 py-0.5 rounded-md text-[11px] font-mono border border-ink-border"
                >
                  {val}
                </span>
              ))}
            </div>
          )}
          {isObject && prop.properties && (
            <div className="pl-4 mt-2.5 border-l-2 border-brass/15">
              {renderSchemaProperties(
                prop.properties,
                prop.required || [],
                `${prefix + key}.`,
              )}
            </div>
          )}
          {isArray && prop.items && prop.items.properties && (
            <div className="pl-4 mt-2.5 border-l-2 border-brass/15">
              <div className="text-[10px] text-brass/60 font-mono uppercase tracking-wide mb-2">
                Array item properties
              </div>
              {renderSchemaProperties(
                prop.items.properties,
                prop.items.required || [],
                `${prefix + key}[].`,
              )}
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
              cls = "text-[#C89A4B] font-semibold";
            } else {
              cls = "text-emerald-400";
            }
          } else if (/true|false/.test(match)) {
            cls = "text-sky-400 font-semibold";
          } else if (/null/.test(match)) {
            cls = "text-slate-400 italic";
          }
          if (cls === "text-[#C89A4B] font-semibold") {
            return `<span class="${cls}">${match.slice(0, -1)}</span>:`;
          }
          return `<span class="${cls}">${match}</span>`;
        },
      );
    } else if (language === "curl") {
      safe = safe
        .replace(
          /(curl|-X|-H|-d|\\)/g,
          '<span class="text-sky-400 font-semibold">$1</span>',
        )
        .replace(
          /("Authorization: [^"]*")/g,
          '<span class="text-amber-400 font-medium">$1</span>',
        )
        .replace(
          /("Content-Type: [^"]*")/g,
          '<span class="text-amber-400 font-medium">$1</span>',
        )
        .replace(
          /("https:\/\/[^"]*")/g,
          '<span class="text-emerald-400 font-medium">$1</span>',
        );
    } else if (language === "node" || language === "python") {
      safe = safe
        .replace(
          /(\/\/.*|#.*)/g,
          '<span class="text-slate-400 italic">$1</span>',
        )
        .replace(
          /\b(const|let|var|await|try|catch|function|import|from|requests|print|json)\b/g,
          '<span class="text-sky-400 font-semibold">$1</span>',
        )
        .replace(
          /("[^"]*"|'[^']*')/g,
          '<span class="text-emerald-400">$1</span>',
        );
    }
    return <span dangerouslySetInnerHTML={{ __html: safe }} />;
  };

  return (
    <div className="min-h-screen bg-ink-bg text-paper flex flex-col font-sans antialiased transition-colors duration-200 [font-feature-settings:'ss01','cv01']">
      {/* Universal Header with Brand Logo, Versioning, and Theme Switching */}
      <header className="h-14 border-b border-ink-border bg-ink-bg/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 -ml-1.5 text-paper hover:text-brass transition-colors lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-[#3EBB6B] to-[#2C8F50] flex items-center justify-center font-black text-white text-[13px] shadow-sm shadow-[#34A853]/30 ring-1 ring-white/10">
              S
            </div>
            <div className="leading-none">
              <span className="font-bold tracking-tight text-paper block text-[13px]">
                Scryme Ledger
              </span>
              <span className="text-[10px] text-brass/90 uppercase tracking-[0.14em] font-semibold">
                V3 API Reference
              </span>
            </div>
          </div>
        </div>

        {/* Center search affordance (desktop) */}
        <button
          onClick={() => searchInputRef.current?.focus()}
          className="hidden md:flex items-center gap-2.5 w-72 px-3 py-1.5 rounded-lg border border-ink-border bg-ink-card/60 text-light-text/70 text-xs hover:border-brass/40 hover:text-light-text transition-colors cursor-pointer"
        >
          <Search size={13} />
          <span className="flex-1 text-left">Search documentation…</span>
          <span className="bg-ink-bg border border-ink-border text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-light-text/70">
            ⌘K
          </span>
        </button>

        <div className="flex items-center gap-2">
          <a
            href="#"
            className="hidden sm:inline-flex items-center text-[11px] font-semibold text-light-text hover:text-paper px-2.5 py-1.5 transition-colors"
          >
            Changelog
          </a>
          <a
            href="#"
            className="hidden sm:inline-flex items-center text-[11px] font-bold bg-brass text-ink-bg hover:bg-white px-3 py-1.5 rounded-md transition-colors"
          >
            Dashboard
          </a>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg border border-ink-border bg-ink-card text-light-text hover:text-paper hover:border-brass/40 transition-all duration-200 cursor-pointer"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {/* Sidebar Left Column */}
        <aside
          className={`fixed inset-y-14 lg:inset-y-0 left-0 w-72 bg-ink-bg border-r border-ink-border overflow-y-auto z-40 transition-transform duration-300 transform
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:h-[calc(100vh-56px)] flex flex-col`}
        >
          {/* Search Box (mobile-visible, always present) */}
          <div className="p-3.5 border-b border-ink-border/60">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/60"
                size={14}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search specs…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-ink-card text-paper pl-8 pr-8 py-2 rounded-lg border border-ink-border focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass text-[13px] transition-all placeholder-light-text/50"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-light-text hover:text-paper"
                >
                  <X size={13} />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-ink-bg border border-ink-border text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-light-text/70">
                  /
                </span>
              )}
            </div>
          </div>

          {/* Expand/Collapse All controls */}
          <div className="px-3.5 py-2.5 flex items-center justify-between text-[10px] font-bold text-light-text/70 uppercase tracking-[0.1em] border-b border-ink-border/30">
            <span>Navigation</span>
            <div className="flex gap-2.5">
              <button
                onClick={expandAllGroups}
                className="hover:text-brass cursor-pointer transition-colors"
              >
                Expand
              </button>
              <span className="text-ink-border">/</span>
              <button
                onClick={collapseAllGroups}
                className="hover:text-brass cursor-pointer transition-colors"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-3.5 space-y-5 overflow-y-auto">
            {/* Core Pinned Customization Guide */}
            {showGuideInSearch && (
              <div className="space-y-0.5">
                <span className="text-[10px] text-brass/80 uppercase tracking-[0.14em] font-bold px-2.5 block mb-1.5">
                  Guides
                </span>
                <button
                  onClick={() => {
                    setActiveEndpointId("cms-customization-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left text-[13px] transition-all duration-150 cursor-pointer ${
                    activeEndpointId === "cms-customization-guide"
                      ? "bg-brass/[0.14] text-paper font-semibold"
                      : "text-light-text hover:text-paper hover:bg-ink-card/70"
                  }`}
                >
                  <BookOpen size={14} className="text-brass shrink-0" />
                  <span className="truncate">CMS Customization Engine</span>
                </button>
                <button
                  onClick={() => {
                    setActiveEndpointId("v3-global-response-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left text-[13px] transition-all duration-150 cursor-pointer ${
                    activeEndpointId === "v3-global-response-guide"
                      ? "bg-brass/[0.14] text-paper font-semibold"
                      : "text-light-text hover:text-paper hover:bg-ink-card/70"
                  }`}
                >
                  <Workflow size={14} className="text-brass shrink-0" />
                  <span className="truncate">Global Response Structure</span>
                </button>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] text-brass/80 uppercase tracking-[0.14em] font-bold px-2.5 block">
                API Reference
              </span>

              {Object.entries(filteredTagGroups).map(([tag, eps]) => {
                const isExpanded = !!expandedGroups[tag];
                const epCount = eps.length;
                return (
                  <div key={tag}>
                    <button
                      onClick={() => toggleGroup(tag)}
                      className="w-full flex items-center justify-between text-left font-semibold text-[12px] text-light-text/90 py-1.5 px-2.5 hover:text-paper rounded-md transition-colors cursor-pointer"
                    >
                      <span className="truncate pr-2">
                        {tag.replace("V3 ", "")}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-light-text/50 text-[10px] font-mono">
                          {epCount}
                        </span>
                        {isExpanded ? (
                          <ChevronDown
                            size={13}
                            className="text-light-text/60"
                          />
                        ) : (
                          <ChevronRight
                            size={13}
                            className="text-light-text/60"
                          />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="space-y-0.5 mt-0.5 mb-1">
                        {eps.map((ep) => {
                          const isActive = activeEndpointId === ep.operationId;
                          return (
                            <button
                              key={ep.operationId}
                              onClick={() => {
                                setActiveEndpointId(ep.operationId);
                                setSidebarOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 py-[7px] pl-4 pr-2.5 rounded-md text-left text-[12.5px] transition-all duration-150 cursor-pointer ${
                                isActive
                                  ? "bg-brass/[0.14] text-paper font-semibold"
                                  : "text-light-text hover:text-paper hover:bg-ink-card/70"
                              }`}
                            >
                              <span
                                className={`text-[8.5px] font-bold px-1.5 py-[1px] rounded uppercase font-mono shrink-0 border ${methodBadge(ep.method)}`}
                              >
                                {ep.method}
                              </span>
                              <span className="truncate">
                                {ep.summary || ep.path}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Footer inside Sidebar */}
          <div className="p-3.5 border-t border-ink-border text-[10px] text-light-text/60 flex items-center justify-between transition-colors duration-200">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] inline-block" />
              All systems operational
            </span>
            <span className="font-mono">v3.0.0</span>
          </div>
        </aside>

        {/* Content Wrapper (Middle + Right columns) */}
        <main className="flex-1 lg:grid lg:grid-cols-12 min-h-[calc(100vh-56px)]">
          {/* MIDDLE COLUMN */}
          <section className="col-span-7 p-6 lg:px-14 lg:py-12 overflow-y-auto space-y-10 border-r border-ink-border/60 max-w-4xl flex flex-col justify-between transition-colors duration-200">
            <div className="space-y-10 flex-1">
              {activeEndpointId === "v3-global-response-guide" ? (
                <GlobalResponseGuide
                  renderHighlightedCode={renderHighlightedCode}
                />
              ) : activeEndpointId === "cms-customization-guide" ? (
                <CmsCustomizationGuide
                  selectedCmsTarget={selectedCmsTarget}
                  setSelectedCmsTarget={setSelectedCmsTarget}
                  simState={simState}
                  onSimStateChange={handleSimStateChange}
                  onApplyPreset={applyPreset}
                  copiedMap={copiedMap}
                  onCopy={handleCopy}
                  renderHighlightedCode={renderHighlightedCode}
                />
              ) : activeEndpoint ? (
                // --- STANDARD ENDPOINT DETAILED VIEW ---
                <div className="space-y-8">
                  {/* Breadcrumb + Header */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-light-text/70 font-medium">
                      <span>Reference</span>
                      <ChevronRight size={11} className="text-light-text/40" />
                      <span className="text-brass">
                        {activeEndpoint.tag.replace("V3 ", "")}
                      </span>
                    </div>
                    <h1 className="text-[28px] font-bold text-paper leading-[1.15] tracking-tight">
                      {activeEndpoint.summary}
                    </h1>
                  </div>

                  {/* Tabs: Reference, Playground, Schema — segmented control */}
                  <div className="inline-flex items-center gap-1 p-1 bg-ink-card/70 border border-ink-border rounded-lg">
                    {(
                      [
                        { key: "reference", label: "Reference", icon: null },
                        { key: "playground", label: "Playground", icon: Play },
                        { key: "schema", label: "Schema", icon: null },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setActiveDocTab(t.key)}
                        className={`px-3.5 py-1.5 text-[11.5px] font-semibold rounded-md cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
                          activeDocTab === t.key
                            ? "bg-brass text-ink-bg shadow-sm"
                            : "text-light-text hover:text-paper"
                        }`}
                      >
                        {t.icon && <t.icon size={11} />}
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {activeDocTab === "reference" && (
                    <div className="space-y-8 animate-fade-in">
                      {/* HTTP Endpoint Tag & Path */}
                      <div className="bg-ink-card rounded-xl border border-ink-border p-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`text-[11px] font-bold px-2 py-1 rounded-md uppercase font-mono tracking-wide border shrink-0 ${methodBadge(activeEndpoint.method)}`}
                          >
                            {activeEndpoint.method}
                          </span>
                          <code className="text-paper font-mono text-[13px] break-all font-medium">
                            {getDynamicUrl(activeEndpoint.path)}
                          </code>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-light-text bg-ink-bg px-2.5 py-1 rounded-md border border-ink-border shrink-0">
                          <Lock size={11} className="text-brass" />
                          <span className="font-mono">Bearer Token</span>
                        </div>
                      </div>

                      {/* Description */}
                      {activeEndpoint.description && (
                        <div className="space-y-2.5">
                          <h2 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                            Description
                          </h2>
                          <p className="text-light-text text-[13.5px] leading-[1.7] whitespace-pre-line">
                            {activeEndpoint.description}
                          </p>
                        </div>
                      )}

                      {/* Path/Query Parameters */}
                      {activeEndpoint.parameters &&
                        activeEndpoint.parameters.length > 0 && (
                          <div className="space-y-3">
                            <h2 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                              Parameters
                            </h2>
                            <div className="border border-ink-border rounded-xl bg-ink-card/40 px-4 divide-y divide-ink-border/50">
                              {activeEndpoint.parameters.map((param: any) => (
                                <div
                                  key={param.name}
                                  className="py-3.5 first:pt-3.5 last:pb-3.5 text-sm"
                                >
                                  <div className="flex flex-wrap items-baseline gap-2.5">
                                    <span className="font-mono text-paper font-semibold text-[13px]">
                                      {param.name}
                                    </span>
                                    <span className="text-brass/90 text-[11px] font-mono font-medium">
                                      {param.schema?.type || "string"}
                                    </span>
                                    <span className="bg-ink-bg text-light-text/80 text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-ink-border uppercase tracking-wide">
                                      {param.in}
                                    </span>
                                    {param.required && (
                                      <span className="text-rose-400 text-[10px] font-mono uppercase font-semibold tracking-wider">
                                        required
                                      </span>
                                    )}
                                  </div>
                                  {param.description && (
                                    <p className="text-light-text mt-1.5 text-xs leading-relaxed">
                                      {param.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Request Body Properties */}
                      {requestBodySchema && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h2 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                              Request Body
                            </h2>
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[9.5px] font-mono px-1.5 py-0.5 rounded font-bold uppercase">
                              json
                            </span>
                          </div>

                          <div className="border border-ink-border rounded-xl bg-ink-card/40 px-4">
                            {requestBodySchema.properties ? (
                              <div>
                                {renderSchemaProperties(
                                  requestBodySchema.properties,
                                  requestBodySchema.required || [],
                                )}
                              </div>
                            ) : (
                              <p className="text-light-text text-xs font-mono py-3.5">
                                Any valid JSON object
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDocTab === "playground" && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-brass/[0.08] text-paper/90 border border-brass/20 rounded-xl p-3.5 text-[12.5px] leading-relaxed flex gap-2.5">
                        <Play
                          size={14}
                          className="text-brass shrink-0 mt-0.5"
                        />
                        <span>
                          <strong className="text-brass">
                            Interactive sandbox.
                          </strong>{" "}
                          Fill in parameters below to rebuild headers, query
                          filters, JSON payloads, and code snippets in real
                          time, then hit <strong>Send Request</strong> to mock a
                          full cycle.
                        </span>
                      </div>

                      {/* Parameters Form Inputs */}
                      {activeEndpoint.parameters &&
                        activeEndpoint.parameters.length > 0 && (
                          <div className="space-y-2.5">
                            <h3 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                              Query & Path Params
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-ink-card/40 border border-ink-border p-4 rounded-xl">
                              {activeEndpoint.parameters.map((param: any) => (
                                <div key={param.name} className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wide text-paper flex items-center justify-between">
                                    <span>
                                      {param.name}{" "}
                                      {param.required && (
                                        <span className="text-rose-400 font-black">
                                          *
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-brass/80 font-mono text-[9px]">
                                      {param.in}
                                    </span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={`Enter ${param.name}…`}
                                    value={playgroundParams[param.name] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPlaygroundParams((prev) => ({
                                        ...prev,
                                        [param.name]: val,
                                      }));
                                    }}
                                    className="w-full bg-ink-bg border border-ink-border rounded-md px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass transition-all"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Request Body Fields Editor */}
                      {requestBodySchema && requestBodySchema.properties && (
                        <div className="space-y-2.5">
                          <h3 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                            Request Payload Fields
                          </h3>
                          <div className="bg-ink-card/40 border border-ink-border p-4 rounded-xl space-y-3.5">
                            {Object.entries(requestBodySchema.properties).map(
                              ([key, prop]: [string, any]) => {
                                const isRequired =
                                  requestBodySchema.required?.includes(key);
                                const currentVal = playgroundBody[key];

                                return (
                                  <div
                                    key={key}
                                    className="space-y-1.5 text-xs"
                                  >
                                    <label className="font-semibold text-paper flex items-baseline justify-between">
                                      <span>
                                        {key}{" "}
                                        {isRequired && (
                                          <span className="text-rose-400">
                                            *
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-brass/80 font-mono text-[9px]">
                                        {prop.type || "string"}
                                      </span>
                                    </label>
                                    {prop.type === "boolean" ? (
                                      <select
                                        value={String(!!currentVal)}
                                        onChange={(e) => {
                                          const boolVal =
                                            e.target.value === "true";
                                          setPlaygroundBody((prev) => ({
                                            ...prev,
                                            [key]: boolVal,
                                          }));
                                        }}
                                        className="w-full bg-ink-bg border border-ink-border rounded-md px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass transition-all"
                                      >
                                        <option value="true">true</option>
                                        <option value="false">false</option>
                                      </select>
                                    ) : prop.type === "number" ||
                                      prop.type === "integer" ? (
                                      <input
                                        type="number"
                                        value={
                                          currentVal === undefined
                                            ? ""
                                            : Number(currentVal)
                                        }
                                        onChange={(e) => {
                                          const numVal =
                                            e.target.value === ""
                                              ? ""
                                              : Number(e.target.value);
                                          setPlaygroundBody((prev) => ({
                                            ...prev,
                                            [key]: numVal,
                                          }));
                                        }}
                                        className="w-full bg-ink-bg border border-ink-border rounded-md px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass transition-all"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={
                                          currentVal === undefined
                                            ? ""
                                            : String(currentVal)
                                        }
                                        onChange={(e) => {
                                          const txtVal = e.target.value;
                                          setPlaygroundBody((prev) => ({
                                            ...prev,
                                            [key]: txtVal,
                                          }));
                                        }}
                                        className="w-full bg-ink-bg border border-ink-border rounded-md px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass transition-all"
                                      />
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                      {/* Playground Send Action Button */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={sendSimulatedRequest}
                          disabled={isPlayingLoading}
                          className="bg-brass hover:bg-white hover:shadow-md hover:-translate-y-px text-ink-bg font-bold text-[12px] px-4 py-2.5 tracking-wide rounded-lg flex items-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:translate-y-0"
                        >
                          {isPlayingLoading ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              Sending…
                            </>
                          ) : (
                            <>
                              <Send size={13} />
                              Send Request
                            </>
                          )}
                        </button>
                      </div>

                      {/* Playground Response Block */}
                      {playgroundResponse && (
                        <div className="space-y-2.5 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                              Response
                            </h4>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                              200 OK · simulated
                            </span>
                          </div>
                          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-sm">
                            <button
                              onClick={() =>
                                handleCopy(
                                  JSON.stringify(playgroundResponse, null, 2),
                                  "playground-resp",
                                )
                              }
                              className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              {copiedMap["playground-resp"] ? (
                                <Check size={13} className="text-emerald-400" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                            <pre className="overflow-x-auto text-emerald-300 whitespace-pre leading-relaxed scrollbar-thin max-h-96">
                              <code>
                                {renderHighlightedCode(
                                  JSON.stringify(playgroundResponse, null, 2),
                                  "json",
                                )}
                              </code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDocTab === "schema" && (
                    <div className="space-y-3.5 animate-fade-in">
                      <h3 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                        Raw response schema
                      </h3>
                      <p className="text-[13px] text-light-text leading-relaxed">
                        The complete model representation, parsed dynamically
                        from the central specification.
                      </p>
                      <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-sm">
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(activeEndpoint.responses, null, 2),
                              "raw-schema",
                            )
                          }
                          className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          {copiedMap["raw-schema"] ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <pre className="overflow-x-auto text-purple-300 whitespace-pre leading-relaxed scrollbar-thin max-h-[500px]">
                          <code>
                            {renderHighlightedCode(
                              JSON.stringify(activeEndpoint.responses, null, 2),
                              "json",
                            )}
                          </code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <BookOpen size={40} className="text-brass/70 mb-4" />
                  <h3 className="text-lg font-bold">Select an API endpoint</h3>
                  <p className="text-light-text text-sm mt-2 max-w-xs">
                    Explore Scryme Ledger's endpoints from the navigation on the
                    left.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls at Bottom */}
            <div className="mt-12 pt-5 border-t border-ink-border/60 flex items-center justify-between text-xs font-semibold text-light-text select-none">
              <button
                onClick={handlePrevPage}
                disabled={currentChronoIndex === 0}
                className="flex items-center gap-1.5 hover:bg-ink-card px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-paper"
              >
                <ArrowLeft size={13} />
                <span>Previous</span>
              </button>

              <div className="text-[10px] text-light-text/50 font-mono">
                {currentChronoIndex + 1} / {chronologicalList.length}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentChronoIndex === chronologicalList.length - 1}
                className="flex items-center gap-1.5 hover:bg-ink-card px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-paper"
              >
                <span>Next</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <section className="col-span-5 bg-[#080d17] p-6 lg:px-10 lg:py-12 overflow-y-auto space-y-7 sticky top-0 lg:h-[calc(100vh-56px)] flex flex-col justify-between border-t lg:border-t-0 border-ink-border">
            <div className="space-y-6 flex-1">
              {/* Target / Request Snippet Block */}
              <div className="space-y-0 rounded-xl overflow-hidden border border-ink-border shadow-lg shadow-black/20">
                {/* Snippet chrome / header bar */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-ink-card border-b border-ink-border">
                  <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.1em] font-bold text-light-text/70">
                    <Code size={12} className="text-brass" />
                    <span>Request</span>
                  </div>
                  <div className="bg-ink-bg rounded-md p-0.5 border border-ink-border flex gap-0.5">
                    {(["curl", "node", "python"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLanguage(lang)}
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded transition-colors cursor-pointer ${
                          codeLanguage === lang
                            ? "bg-brass text-ink-bg"
                            : "text-light-text hover:text-paper"
                        }`}
                      >
                        {lang === "curl"
                          ? "cURL"
                          : lang === "node"
                            ? "Node"
                            : "Python"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group bg-ink-bg p-4 text-xs font-mono text-left">
                  {/* Copy Button */}
                  <button
                    onClick={() =>
                      handleCopy(codeSnippets[codeLanguage], "request")
                    }
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    {copiedMap["request"] ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>

                  <pre className="overflow-x-auto text-paper whitespace-pre leading-relaxed select-all scrollbar-thin max-h-96">
                    <code>
                      {renderHighlightedCode(
                        codeSnippets[codeLanguage],
                        codeLanguage,
                      )}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Response Block (Only for non-guide/standard endpoints reference view) */}
              {activeEndpointId !== "cms-customization-guide" &&
                activeEndpointId !== "v3-global-response-guide" &&
                activeDocTab === "reference" && (
                  <div className="space-y-0 rounded-xl overflow-hidden border border-ink-border shadow-lg shadow-black/20 animate-fade-in">
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-ink-card border-b border-ink-border">
                      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.1em] font-bold text-light-text/70">
                        <Terminal size={12} className="text-brass" />
                        <span>Response</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                        200 OK
                      </span>
                    </div>

                    <div className="relative group bg-ink-bg p-4 text-xs font-mono text-left">
                      <button
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(mockResponsePayload, null, 2),
                            "response",
                          )
                        }
                        className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        {copiedMap["response"] ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>

                      <pre className="overflow-x-auto text-emerald-300 whitespace-pre leading-relaxed scrollbar-thin max-h-[350px]">
                        <code>
                          {renderHighlightedCode(
                            JSON.stringify(mockResponsePayload, null, 2),
                            "json",
                          )}
                        </code>
                      </pre>
                    </div>
                  </div>
                )}
            </div>

            {/* Quick Helper Docs */}
            <div className="pt-6 border-t border-ink-border/60 hidden lg:block transition-colors duration-200">
              <div className="bg-ink-card/40 border border-ink-border/60 rounded-xl p-4 text-xs space-y-2 text-left">
                <div className="font-bold text-brass flex items-center gap-1.5">
                  <Fingerprint size={12} />
                  <span>Sandbox Credentials</span>
                </div>
                <p className="text-light-text leading-relaxed">
                  Use the <code className="text-paper">/v3/auth/token</code>{" "}
                  endpoint in sandbox mode to exchange client credentials. All
                  write operations require a valid organization scope.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
