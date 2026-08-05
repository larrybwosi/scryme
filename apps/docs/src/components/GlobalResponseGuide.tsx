// components/GlobalResponseGuide.tsx
import React from "react";
import { Workflow } from "lucide-react";

// --- Design Tokens ---
const colors = {
  inkBg: "var(--bg-color)",
  inkCard: "var(--card-color)",
  inkBorder: "var(--border-color)",
  brass: "#C89A4B",
  paper: "var(--text-color)",
  lightText: "var(--light-text-color)",
};

// --- Component Props ---
interface GlobalResponseGuideProps {
  renderHighlightedCode: (code: string, language: string) => JSX.Element;
}

/**
 * Global Response Structure Guide Component
 *
 * Documents the V3 API's standardized response envelope format used across all endpoints.
 * Provides examples of success and error response structures.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.renderHighlightedCode - Function to render syntax-highlighted code
 */
export default function GlobalResponseGuide({
  renderHighlightedCode,
}: GlobalResponseGuideProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 text-xs text-brass uppercase tracking-wider font-semibold mb-2">
          <span>Developer Guide</span>
          <span>&bull;</span>
          <span>API Design & Standards</span>
        </div>
        <h1 className="text-3xl font-extrabold text-paper leading-tight">
          V3 Global Response Structure
        </h1>
        <p className="text-light-text text-sm mt-2 leading-relaxed">
          All REST API endpoints in Scryme V3 wrap responses inside a
          standardized global envelope. This architecture guarantees a highly
          consistent data integration contract for custom frontends, headless
          portals, and internal workflows.
        </p>
      </div>

      {/* Standard Response Conceptual Card */}
      <div className="bg-ink-card/50 rounded-xl border border-ink-border p-5 space-y-3">
        <div className="flex items-center gap-2 text-brass font-bold text-sm">
          <Workflow size={16} />
          <span>Consistent Response Wrapping</span>
        </div>
        <p className="text-xs text-light-text leading-relaxed">
          Whether you are querying products, updating customer details, or
          submitting point-of-sale transactions, successful responses (HTTP 2xx)
          are wrapped in a generic envelope. This prevents client crash states
          on unexpected nulls, standardizes analytics parsing, and automates
          server response validation.
        </p>
      </div>

      {/* Envelope Properties Details */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">
          Successful Envelope Properties
        </h2>

        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-paper font-black text-sm">
              success
            </span>
            <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              boolean
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Always returns <code className="text-paper">true</code> for
            successful operations. Allows fast frontend branching and exception
            handling without inspecting response status codes.
          </p>
        </div>

        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-paper font-black text-sm">
              data
            </span>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              any / generics (T)
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            The requested database or operation payload. Represents the actual
            model DTO schemas defined in the endpoint specifications (e.g.{" "}
            <code className="text-paper font-mono">ProductResponseDto</code>,{" "}
            <code className="text-paper font-mono">CustomerResponseDto</code>).
          </p>
        </div>

        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-paper font-black text-sm">
              timestamp
            </span>
            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              string (ISO8601)
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            The precise server-side execution ISO-8601 timestamp (UTC) for
            automatic drift alignment and offline transaction reconciliations.
          </p>
        </div>

        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-paper font-black text-sm">
              meta (optional)
            </span>
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              object
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Optional metadata wrapper used primarily for collection pagination
            offsets, filter cursors, or server transaction tracing.
          </p>
        </div>
      </div>

      {/* Standard Error Conceptual Card */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-paper border-b border-ink-border pb-2">
          Error Response Envelope
        </h2>
        <p className="text-xs text-light-text">
          When requests fail due to server conditions, validation blocks (HTTP
          400), or credential failures (HTTP 401), the API returns a structured
          error body instead of raw text.
        </p>

        <div className="border border-ink-border rounded-xl bg-ink-bg/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-paper font-black text-sm">
              error
            </span>
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              object
            </span>
          </div>
          <p className="text-xs text-light-text leading-relaxed">
            Contains detailed error specifications:
          </p>
          <div className="bg-ink-card rounded-lg border border-ink-border p-3 text-xs font-mono space-y-1.5">
            <div>
              • <span className="text-paper font-bold">success</span> (boolean):
              Always <code className="text-red-400">false</code> in error
              conditions.
            </div>
            <div>
              • <span className="text-paper font-bold">error.message</span>{" "}
              (string): Human readable high-level reason description.
            </div>
            <div>
              • <span className="text-paper font-bold">error.code</span>{" "}
              (string): Technical machine-parsable error identifier.
            </div>
            <div>
              • <span className="text-paper font-bold">error.details</span>{" "}
              (array of strings): Validation breakdowns or nested validation
              error messages.
            </div>
          </div>
        </div>
      </div>

      {/* Global Spec Examples */}
      <div className="space-y-6">
        <span className="text-xs uppercase tracking-widest font-black text-brass">
          Global Spec Examples
        </span>

        <div className="space-y-2 text-left">
          <span className="text-[10px] font-bold text-light-text block">
            STANDARD SUCCESS ENVELOPE:
          </span>
          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl">
            <pre className="overflow-x-auto text-green-300 whitespace-pre leading-relaxed scrollbar-thin">
              <code>
                {renderHighlightedCode(
                  JSON.stringify(
                    {
                      success: true,
                      timestamp: new Date().toISOString(),
                      data: {
                        id: "prod_123",
                        name: "Artisan Sourdough",
                        sku: "SRV-BKA-001",
                        price: 12.5,
                      },
                    },
                    null,
                    2,
                  ),
                  "json",
                )}
              </code>
            </pre>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <span className="text-[10px] font-bold text-light-text block">
            STANDARDIZED ERROR ENVELOPE:
          </span>
          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-xl">
            <pre className="overflow-x-auto text-red-300 whitespace-pre leading-relaxed scrollbar-thin">
              <code>
                {renderHighlightedCode(
                  JSON.stringify(
                    {
                      success: false,
                      timestamp: new Date().toISOString(),
                      error: {
                        message: "Invalid request parameters",
                        code: "BAD_REQUEST",
                        details: [
                          "email must be a valid email address",
                          "phone number must follow international E.164 formats",
                        ],
                      },
                    },
                    null,
                    2,
                  ),
                  "json",
                )}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
