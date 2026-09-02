const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEFAULT_MODELS = {
  cloudflare: "@cf/meta/llama-3.1-8b-instruct-fp8",
  gemini: "gemini-3.5-flash-lite",
  openrouter: "openai/gpt-4o-mini",
};

function buildPrompt(task, { title, description, bodyText }) {
  const context = `Title: ${title || "(untitled)"}\nExcerpt: ${description || "(none)"}\nBody:\n${(bodyText || "").slice(0, 6000)}`;

  switch (task) {
    case "title-suggestions":
      return `You are an editor helping title a blog article. Based on the article below, suggest 5 alternative titles. Return ONLY a numbered list, one title per line, no extra commentary.\n\n${context}`;
    case "auto-excerpt":
      return `Write a single, compelling excerpt/meta description for this article, maximum 160 characters. Return ONLY the excerpt text, nothing else.\n\n${context}`;
    case "generate-outline":
      return `Propose an outline of 4-7 H2 section headings for this article. Return ONLY a numbered list of headings, no extra commentary.\n\n${context}`;
    case "seo-optimizer":
      return `Review this article's title and excerpt for SEO. Give 3-5 short, concrete, actionable suggestions to improve them. Return ONLY a numbered list.\n\n${context}`;
    default:
      throw new Error(`Unknown task: ${task}`);
  }
}

async function runCloudflare(env, model, prompt) {
  const result = await env.AI.run(model || DEFAULT_MODELS.cloudflare, {
    messages: [{ role: "user", content: prompt }],
  });
  return result.response;
}

async function runGemini(env, model, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || DEFAULT_MODELS.gemini}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Gemini request failed");
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function runOpenRouter(env, model, prompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.openrouter,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "OpenRouter request failed");
  return data.choices?.[0]?.message?.content ?? "";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/generate" || request.method !== "POST") {
      return new Response("Not found", { status: 404, headers: CORS_HEADERS });
    }

    try {
      const { task, provider, model, title, description, bodyText } = await request.json();
      const prompt = buildPrompt(task, { title, description, bodyText });

      let result;
      if (provider === "cloudflare") {
        result = await runCloudflare(env, model, prompt);
      } else if (provider === "gemini") {
        result = await runGemini(env, model, prompt);
      } else if (provider === "openrouter") {
        result = await runOpenRouter(env, model, prompt);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      return new Response(JSON.stringify({ result }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  },
};
