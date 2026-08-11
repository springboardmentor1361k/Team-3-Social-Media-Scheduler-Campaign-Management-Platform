/**
 * aiAssistant.ts
 * Dynamic Google Gemini AI Engine with Automatic Model Discovery via ListModels API
 */

export type AITone = "Viral" | "Professional" | "Witty" | "Educational" | "Promotional";
export type AIAction = "generate" | "fix_grammar" | "make_shorter" | "add_emojis" | "add_cta";

export interface AIGenerationResult {
  content: string;
  hashtags: string[];
  suggestedPlatforms?: string[];
  modelUsed: string;
}

export function getStoredGeminiKey(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sp_gemini_key") || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
}

export function setStoredGeminiKey(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("sp_gemini_key", key.trim());
  }
}

/**
 * Dynamically query Google AI Studio ListModels endpoint to discover active models
 */
async function discoverActiveGeminiModel(apiKey: string): Promise<string[]> {
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const data = await listRes.json();
      const models = data.models || [];

      // Filter models that support generateContent method
      const validModels = models
        .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
        .map((m: any) => m.name.replace("models/", ""));

      if (validModels.length > 0) {
        // Sort to prioritize flash & fast models first
        validModels.sort((a: string, b: string) => {
          if (a.includes("flash") && !b.includes("flash")) return -1;
          if (!a.includes("flash") && b.includes("flash")) return 1;
          return 0;
        });
        return validModels;
      }
    }
  } catch (err) {
    console.warn("Failed to discover models via ListModels API:", err);
  }

  // Known active fallback model identifiers
  return [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
  ];
}

/**
 * Generate or Refine post copy using Real Google Gemini AI
 */
export async function generateAIPostContent({
  prompt,
  tone = "Viral",
  platform = "X",
  currentContent = "",
  action = "generate",
  customKey = "",
}: {
  prompt: string;
  tone?: AITone;
  platform?: string;
  currentContent?: string;
  action?: AIAction;
  customKey?: string;
}): Promise<AIGenerationResult> {
  const apiKey = (customKey || getStoredGeminiKey()).trim();
  const targetInput = (prompt || currentContent || "").trim();

  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please enter your free Google Gemini API key to use Real AI.");
  }

  if (!targetInput) {
    throw new Error("Please enter a topic or draft idea for Gemini AI to process.");
  }

  let promptInstruction = "";

  if (action === "fix_grammar") {
    promptInstruction = `Fix all grammar, spelling, and punctuation errors in the following text. Keep the exact meaning intact and return only the corrected text:
"${targetInput}"`;
  } else if (action === "make_shorter") {
    promptInstruction = `Make the following social media post text significantly shorter, punchier, and more concise for ${platform}:
"${targetInput}"`;
  } else if (action === "add_emojis") {
    promptInstruction = `Add relevant emojis and clean line-break formatting to the following post text:
"${targetInput}"`;
  } else if (action === "add_cta") {
    promptInstruction = `Add a powerful, high-converting Call-To-Action (CTA) suitable for ${platform} at the end of this post:
"${targetInput}"`;
  } else {
    promptInstruction = `You are an expert social media copywriter. Write a highly engaging ${tone} post for ${platform}.
Topic / Context: "${targetInput}"
Instructions:
- Write in a natural, compelling ${tone.toLowerCase()} tone.
- Format with clean line breaks and relevant emojis.
- End with 3-5 trending, highly relevant hashtags.
- Do NOT include any markdown code blocks or wrapper quotes.`;
  }

  // Discover valid active model names dynamically for this key
  const candidateModels = await discoverActiveGeminiModel(apiKey);

  let lastErrorMsg = "";
  let successfulText = "";
  let modelNameUsed = "";

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptInstruction }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          successfulText = rawText.trim();
          modelNameUsed = model;
          break; // Success!
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        lastErrorMsg = errorData?.error?.message || `HTTP ${response.status}`;
      }
    } catch (err: any) {
      lastErrorMsg = err.message || "Network error";
    }
  }

  if (!successfulText) {
    throw new Error(lastErrorMsg || "Failed to reach Google Gemini API. Please verify your API Key in Google AI Studio.");
  }

  // Extract hashtags from response for composer tag chips
  const hashtagMatches: string[] = successfulText.match(/#[a-zA-Z0-9_]+/g) || [];
  const cleanHashtags: string[] = Array.from<string>(new Set(hashtagMatches.map((h: string) => h.replace("#", ""))));

  return {
    content: successfulText,
    hashtags: cleanHashtags,
    modelUsed: `Google ${modelNameUsed}`,
  };
}
