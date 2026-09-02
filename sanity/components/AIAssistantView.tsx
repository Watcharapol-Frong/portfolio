import { useState } from "react";
import { useFormValue, useDocumentOperation } from "sanity";

const WORKER_URL = "https://ai-assistant-worker.frongbook.workers.dev/generate";

interface PortableTextChild {
  text?: string;
}
interface PortableTextBlock {
  _type: string;
  children?: PortableTextChild[];
}

function plainTextFromBody(body: unknown): string {
  if (!Array.isArray(body)) return "";
  return (body as PortableTextBlock[])
    .filter((b) => b._type === "block")
    .map((b) => (b.children ?? []).map((c) => c.text ?? "").join(""))
    .join("\n\n");
}

const PROVIDERS: Record<string, { label: string; models: string[] }> = {
  cloudflare: {
    label: "Cloudflare Workers AI (Free)",
    models: ["@cf/meta/llama-3.1-8b-instruct-fp8", "@cf/meta/llama-3.2-3b-instruct"],
  },
  gemini: {
    label: "Gemini",
    models: ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.1-pro-preview"],
  },
  openrouter: {
    label: "OpenRouter",
    models: [],
  },
};

const TOOLS: { id: string; label: string; icon: string; applies: boolean }[] = [
  { id: "title-suggestions", label: "Title Suggestions", icon: "✨", applies: true },
  { id: "auto-excerpt", label: "Auto Excerpt", icon: "\u{1F4DD}", applies: true },
  { id: "generate-outline", label: "Generate Outline", icon: "\u{1F4CB}", applies: false },
  { id: "seo-optimizer", label: "SEO Optimizer", icon: "\u{1F4CA}", applies: false },
];

interface Props {
  documentId: string;
  schemaType: string;
}

export function AIAssistantView(props: Props) {
  const { documentId, schemaType } = props;
  const title = useFormValue(["title"]) as string | undefined;
  const description = useFormValue(["description"]) as string | undefined;
  const body = useFormValue(["body"]);
  const ops = useDocumentOperation(documentId, schemaType);

  const [provider, setProvider] = useState("cloudflare");
  const [model, setModel] = useState("");
  const [used, setUsed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const runTool = async (taskId: string) => {
    setLoading(taskId);
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: taskId,
          provider,
          model: model || undefined,
          title,
          description,
          bodyText: plainTextFromBody(body),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults((r) => ({ ...r, [taskId]: data.result }));
      setUsed((u) => ({ ...u, [taskId]: true }));
    } catch (err) {
      setResults((r) => ({ ...r, [taskId]: `Error: ${(err as Error).message}` }));
    } finally {
      setLoading(null);
    }
  };

  const applyResult = (taskId: string) => {
    const text = results[taskId];
    if (!text) return;
    if (taskId === "auto-excerpt") {
      ops.patch.execute([{ set: { description: text.trim() } }]);
    } else if (taskId === "title-suggestions") {
      const first = text
        .split("\n")
        .map((l) => l.replace(/^\d+[.)]\s*/, "").replace(/^["']|["']$/g, "").trim())
        .filter(Boolean)[0];
      if (first) ops.patch.execute([{ set: { title: first } }]);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, marginBottom: 4, opacity: 0.7 }}>Provider</label>
        <select
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value);
            setModel("");
          }}
          style={{ width: "100%", padding: 6 }}
        >
          {Object.entries(PROVIDERS).map(([key, p]) => (
            <option key={key} value={key}>
              {p.label}
            </option>
          ))}
        </select>

        {PROVIDERS[provider].models.length > 0 ? (
          <select value={model} onChange={(e) => setModel(e.target.value)} style={{ width: "100%", padding: 6, marginTop: 8 }}>
            <option value="">Default model</option>
            {PROVIDERS[provider].models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model id (e.g. openai/gpt-4o-mini)"
            style={{ width: "100%", padding: 6, marginTop: 8 }}
          />
        )}
      </div>

      {TOOLS.map((tool) => (
        <div
          key={tool.id}
          style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: 12, marginBottom: 8 }}
        >
          <button
            type="button"
            onClick={() => runTool(tool.id)}
            disabled={loading === tool.id || used[tool.id]}
            style={{
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: used[tool.id] ? "default" : "pointer",
              opacity: used[tool.id] ? 0.5 : 1,
              fontSize: 14,
            }}
          >
            {tool.icon} {tool.label} {loading === tool.id ? "..." : used[tool.id] ? "(used)" : ""}
          </button>

          {results[tool.id] && (
            <div style={{ marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>
              {results[tool.id]}
              {tool.applies && (
                <div>
                  <button type="button" onClick={() => applyResult(tool.id)} style={{ marginTop: 6 }}>
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <p style={{ fontSize: 11, opacity: 0.6, marginTop: 16 }}>
        Each tool can be used once per session. Reload the page to reset.
      </p>
    </div>
  );
}
