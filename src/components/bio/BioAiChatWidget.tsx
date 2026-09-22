import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Phone,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import type { BioAiAssistantSettings, BioEditorBlock } from "../../types";
import { sendBioChatMessage, submitChatLead, type ChatMessage } from "../../lib/aiChatApi";

interface BioAiChatWidgetProps {
  pageId: string;
  pageTitle: string;
  pageSlug?: string;
  pageBio?: string;
  settings?: BioAiAssistantSettings;
  blocks?: BioEditorBlock[];
  ownerUserId?: string;
  onLeadCaptured?: (name: string, phone: string) => void;
  /** When rendered in editor live preview frame */
  isEditorPreview?: boolean;
}

export default function BioAiChatWidget({
  pageId,
  pageTitle,
  pageSlug = "",
  pageBio = "",
  settings,
  blocks = [],
  ownerUserId,
  onLeadCaptured,
  isEditorPreview = false
}: BioAiChatWidgetProps) {
  // If explicitly disabled in settings, do not render
  if (settings && settings.enabled === false) {
    return null;
  }

  const botName = settings?.botName || "AI Assistant";
  const welcomeMsg =
    settings?.welcomeMessage ||
    `👋 Hello! Welcome to **${settings?.businessName || pageTitle}**. I am your AI Assistant. How can I help you today?`;
  const primaryColor = settings?.primaryColor || "#6366f1";
  const contactPhone = settings?.contactPhone || "";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      role: "assistant",
      content: welcomeMsg,
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await sendBioChatMessage({
        pageId,
        pageTitle,
        pageSlug,
        pageBio,
        ownerUserId,
        aiSettings: settings,
        blocks,
        messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        visitorInfo: leadPhone ? { name: leadName, phone: leadPhone } : undefined
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (response.leadCaptured && onLeadCaptured) {
        onLeadCaptured(leadName || "AI Chat Visitor", leadPhone);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `I'm here to help! For immediate queries, please reach us directly on WhatsApp${
            contactPhone ? `: [Chat on WhatsApp](https://wa.me/${contactPhone.replace(/\D/g, "")})` : ""
          }`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadPhone.trim() || leadLoading) return;

    setLeadLoading(true);
    try {
      await submitChatLead({
        name: leadName.trim() || "Bio Visitor",
        phone: leadPhone.trim(),
        pageId,
        pageTitle,
        pageSlug,
        ownerUserId,
        notes: `Captured via Quick Callback request on ${pageTitle}`
      });

      setLeadSubmitted(true);
      setShowLeadForm(false);
      if (onLeadCaptured) onLeadCaptured(leadName, leadPhone);

      setMessages((prev) => [
        ...prev,
        {
          id: `lead-success-${Date.now()}`,
          role: "assistant",
          content: `✅ Thank you, **${leadName || "Friend"}**! We have received your contact number (${leadPhone}). Our team will get in touch with you shortly.`,
          timestamp: Date.now()
        }
      ]);
    } catch {
      alert("Unable to submit contact. Please try again.");
    } finally {
      setLeadLoading(false);
    }
  };

  // Helper to render markdown-like links [text](url) and bold text
  const renderFormattedText = (content: string) => {
    // Replace markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 underline bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/30 my-0.5 break-all transition-all hover:scale-105"
        >
          <span>{label}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.map((part, i) => {
      if (typeof part === "string") {
        // Split for bold **text**
        const boldSegments = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <React.Fragment key={i}>
            {boldSegments.map((seg, j) => {
              if (seg.startsWith("**") && seg.endsWith("**")) {
                return (
                  <strong key={j} className="font-bold text-white">
                    {seg.slice(2, -2)}
                  </strong>
                );
              }
              return seg;
            })}
          </React.Fragment>
        );
      }
      return part;
    });
  };

  const quickPrompts = [
    { label: "💰 Pricing Details", query: "Can you tell me the pricing and current offers?" },
    { label: "📞 Request Callback", action: () => setShowLeadForm(true) },
    { label: "🚚 Delivery & Timing", query: "What are your delivery timelines and working hours?" },
    ...(contactPhone
      ? [{ label: "💬 WhatsApp Us", query: "How can I contact you directly on WhatsApp?" }]
      : [])
  ];

  return (
    <div
      className={`key-ai-chat-root z-50 select-none ${
        isEditorPreview ? "absolute bottom-3 right-3" : "fixed bottom-4 right-4 sm:bottom-6 sm:right-6"
      }`}
    >
      {/* Floating Chat Trigger Button - Compact Animated Circle */}
      {!isOpen && (
        <div className="relative flex items-center group/aibtn">
          {/* Animated Ambient Glow & Radar Ping */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 opacity-70 blur-[3px] animate-pulse pointer-events-none" />
          <span className="absolute -inset-0.5 rounded-full bg-cyan-400/30 animate-ping pointer-events-none" style={{ animationDuration: "2.5s" }} />

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={`Open ${botName} Live Chat`}
            className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-white shadow-xl border border-white/30 backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, #a855f7, #06b6d4)`
            }}
          >
            {/* Ambient Shimmer */}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/aibtn:opacity-100 transition-opacity duration-300" />
            <Bot className="relative z-10 h-5 w-5 text-white drop-shadow transition-transform duration-300 group-hover/aibtn:rotate-12 group-hover/aibtn:scale-110" />

            {/* Online Pulse Indicator */}
            <span className="absolute top-0.5 right-0.5 z-20 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-sm animate-pulse" />

            {/* Unread Message Counter Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 z-30 h-4 w-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center border-2 border-slate-900 shadow-md animate-bounce">
                1
              </span>
            )}
          </button>

          {/* Micro Hover Tooltip */}
          <span className="pointer-events-none absolute -top-7 right-1/2 translate-x-1/2 opacity-0 group-hover/aibtn:opacity-100 transition-opacity duration-150 px-2 py-0.5 rounded bg-slate-950 text-[9px] font-bold text-white border border-slate-800 whitespace-nowrap shadow-xl z-50">
            Chat with {botName}
          </span>
        </div>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div
          className={`flex flex-col rounded-2xl bg-slate-950/95 border border-cyan-500/30 text-white shadow-2xl backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200 ${
            isEditorPreview
              ? "w-[300px] h-[440px]"
              : "w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div
            className="px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}dd, #1e1b4bdd)`
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white shadow-inner">
                  <Bot className="h-5 w-5 text-cyan-300" />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white truncate leading-tight flex items-center gap-1.5">
                  <span>{botName}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                    AI
                  </span>
                </h4>
                <p className="text-[10px] text-slate-300/90 truncate flex items-center gap-1 mt-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-cyan-300" />
                  <span>24/7 Virtual Sales Assistant</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close Chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-slate-900/60 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (item.action) item.action();
                  else if (item.query) handleSendMessage(item.query);
                }}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-indigo-600/50 border border-slate-700/60 hover:border-cyan-400/40 text-[10px] font-medium text-slate-200 hover:text-white transition-all shadow-sm flex items-center gap-1"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Messages Stream Container */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3 key-chat-stream">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-cyan-300 shrink-0 mt-1">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs"
                      : "bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-bl-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{renderFormattedText(msg.content)}</div>
                </div>

                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 mt-1">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs py-1">
                <div className="h-6 w-6 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                  <Bot className="h-3 w-3 animate-spin" />
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse delay-300" />
                  <span className="text-[10px] text-slate-400 font-mono ml-1">Typing...</span>
                </div>
              </div>
            )}

            {/* Inline Quick Lead Capture Modal */}
            {showLeadForm && !leadSubmitted && (
              <div className="p-3.5 rounded-xl bg-gradient-to-b from-indigo-950/80 to-slate-950 border border-indigo-500/40 shadow-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-cyan-400" />
                    Request a Direct Callback
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <form onSubmit={handleQuickLeadSubmit} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900/90 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone / WhatsApp Number *"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900/90 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={leadLoading || !leadPhone.trim()}
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {leadLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Submit & Request Callback</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-slate-900/90 border-t border-white/10 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything or request info..."
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="h-8.5 w-8.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 hover:text-white flex items-center justify-center transition-all disabled:opacity-40 shrink-0 shadow-md"
              aria-label="Send Message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Brand Watermark */}
          <div className="px-3 py-1 bg-slate-950/80 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500/80" />
              <span>100% Free AI • Instant Answers</span>
            </span>
            <span className="font-bold text-slate-400">KeyLink360 AI</span>
          </div>
        </div>
      )}
    </div>
  );
}
