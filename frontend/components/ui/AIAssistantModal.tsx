"use client";

import { useEffect, useState } from "react";
import { Sparkles, Wand2, Check, X, Copy, RefreshCw, Lightbulb, Key, ExternalLink, AlertCircle } from "lucide-react";
import { AITone, AIAction, generateAIPostContent, getStoredGeminiKey, setStoredGeminiKey } from "@/lib/aiAssistant";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string, hashtags: string[]) => void;
  initialPrompt?: string;
  targetPlatform?: string;
}

const tones: { key: AITone; label: string; desc: string; icon: string }[] = [
  { key: "Viral", label: "Viral / Engaging", desc: "Catchy hooks & high engagement", icon: "🚀" },
  { key: "Professional", label: "Professional", desc: "Clean, executive & corporate", icon: "💼" },
  { key: "Witty", label: "Witty / Punchy", desc: "Humorous & relatable banter", icon: "☕️" },
  { key: "Educational", label: "Educational", desc: "Step-by-step takeaways & tips", icon: "📚" },
  { key: "Promotional", label: "Promotional", desc: "High conversion & strong CTA", icon: "⚡️" },
];

const quickActions: { key: AIAction; label: string; icon: string }[] = [
  { key: "generate", label: "Rewrite in Tone", icon: "✨" },
  { key: "fix_grammar", label: "Fix Grammar", icon: "🪄" },
  { key: "make_shorter", label: "Make Shorter", icon: "✂️" },
  { key: "add_emojis", label: "Add Emojis", icon: "😀" },
  { key: "add_cta", label: "Add Strong CTA", icon: "🎯" },
];

export default function AIAssistantModal({
  isOpen,
  onClose,
  onInsert,
  initialPrompt = "",
  targetPlatform = "X",
}: AIAssistantModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedTone, setSelectedTone] = useState<AITone>("Viral");
  const [selectedAction, setSelectedAction] = useState<AIAction>("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync prompt and load stored key EVERY time modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGeminiKey();
      setApiKey(stored);
      setPrompt(initialPrompt || "");
      setGeneratedContent("");
      setGeneratedHashtags([]);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, initialPrompt]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleKeyChange = (val: string) => {
    setApiKey(val);
    setStoredGeminiKey(val);
    if (error && val.trim()) setError(null);
  };

  const handleGenerate = async (overrideAction?: AIAction) => {
    const actionToUse = overrideAction || selectedAction;
    if (!apiKey.trim()) {
      setError("Please enter your Free Google Gemini API Key below to run Real AI.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateAIPostContent({
        prompt: prompt || initialPrompt,
        tone: selectedTone,
        platform: targetPlatform,
        currentContent: initialPrompt,
        action: actionToUse,
        customKey: apiKey,
      });

      setGeneratedContent(result.content);
      setGeneratedHashtags(result.hashtags);
    } catch (e: any) {
      console.error("Gemini AI error:", e);
      setError(e.message || "Failed to generate AI content. Check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!generatedContent) return;
    onInsert(generatedContent, generatedHashtags);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#130f2c] via-[#0d0922] to-[#080516] border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-violet-950/60 overflow-hidden space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar cursor-default"
      >
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">Google Gemini AI Assistant</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Real AI Model
                </span>
              </div>
              <p className="text-xs text-white/50">AI post generation, tone rewriting & grammar polish for social media</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gemini API Key Bar */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-violet-950/20 border border-violet-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" /> Free Google Gemini API Key
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Get Free Key (Google AI Studio) <ExternalLink size={12} />
            </a>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder="Paste your free Gemini API key (AIzaSy...)"
            className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-white/20"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="relative z-10 flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Input & Controls */}
        <div className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1.5 flex items-center justify-between">
              <span>Composer Copy / Topic Prompt</span>
              <span className="text-[11px] text-violet-400 font-medium">Target: Social Media Channels</span>
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your topic, draft idea, or paste text for Gemini AI to rewrite..."
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-white/30 resize-none"
            />
          </div>

          {/* Tone Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-white/70 mb-2">Select Tone</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {tones.map((t) => {
                const active = selectedTone === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedTone(t.key)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? "bg-violet-600/30 border-violet-500 text-white ring-2 ring-violet-500/40 shadow-lg"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-base mb-1">{t.icon}</span>
                    <span className="text-xs font-bold">{t.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {quickActions.map((act) => (
              <button
                key={act.key}
                type="button"
                onClick={() => {
                  setSelectedAction(act.key);
                  handleGenerate(act.key);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedAction === act.key
                    ? "bg-indigo-600/40 border-indigo-500 text-indigo-200"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                }`}
              >
                <span>{act.icon}</span> {act.label}
              </button>
            ))}
          </div>

          {/* Generate Action Button */}
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-violet-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Processing AI Generation with Gemini...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" /> Generate Real AI Copy with Gemini
              </>
            )}
          </button>
        </div>

        {/* Output Preview Section */}
        {generatedContent && (
          <div className="relative z-10 space-y-3 pt-2 border-t border-white/10 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Real Gemini AI Output:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-sm text-white/90 leading-relaxed font-medium whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
              {generatedContent}
            </div>

            {/* Generated Hashtags */}
            {generatedHashtags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-violet-400">
                <span className="text-white/40 text-[11px] font-bold">Suggested Tags:</span>
                {generatedHashtags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-[11px] font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsert}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Replace in Composer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
