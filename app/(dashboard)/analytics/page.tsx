"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, ShieldCheck, Sparkles, Trash2, AlertTriangle, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/features/auth/role-guard";
import { Markdown } from "@/features/analytics/Markdown";
import { useAdminAssistant } from "@/hooks/useEnterprise";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
  reason?: string;
}

const SUGGESTED_QUESTIONS = [
  "Summarize the platform health and give me an executive overview.",
  "Are there any services down or degraded right now?",
  "What is our AI usage cost this period? Any anomalies?",
  "Show me revenue and payment performance across the platform.",
  "Give me security recommendations based on the latest audit logs.",
  "How are users and content growing? Any optimization opportunities?",
  "Detect anomalies in API error rates or response times.",
  "Generate a weekly operations report.",
];

function escapeId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function AdminAssistantContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello, I'm your **AI Admin Assistant**.\n\nI analyze live data from **Core-Server**, **AI-Service**, **GeoContext**, **PostgreSQL**, and the **Vector Database (Qdrant)** to answer questions about the platform, explain problems, detect anomalies, and recommend optimizations and security improvements.\n\nTry one of the suggested questions below, or ask your own.",
    },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mutation = useAdminAssistant();

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, mutation.isPending]);

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || mutation.isPending) return;

    setError(null);
    setMessages((prev) => [...prev, { id: escapeId(), role: "user", content: question }]);
    setInput("");

    try {
      const result = await mutation.mutateAsync(question);
      setMessages((prev) => [
        ...prev,
        {
          id: escapeId(),
          role: "assistant",
          content: result.answer || "I couldn't generate a response.",
          blocked: result.blocked,
          reason: result.reason,
        },
      ]);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "The assistant is temporarily unavailable.";
      setError(message);
      setMessages((prev) => [...prev, { id: escapeId(), role: "assistant", content: `⚠️ **Unable to respond:** ${message}` }]);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Chat cleared. Ask me anything about the platform — health, users, revenue, AI usage, or security.",
      },
    ]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Admin Assistant"
        description="Secure AI analyst for the entire platform — ask anything, get answers from live data"
      >
        <Button variant="outline" size="sm" onClick={clearChat} disabled={mutation.isPending}>
          <Trash2 className="size-4" />
          Clear Chat
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <DashboardCard title="Security & Guardrails">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2 rounded-xl bg-emerald-500/5 p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <p className="text-muted-foreground">
                  Admin-only access, prompt-injection protection, and full audit logging on every query.
                </p>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-blue-500/5 p-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-500" />
                <p className="text-muted-foreground">
                  Answers are generated strictly from live platform snapshots — no secrets are ever exposed.
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Suggested Questions">
            <div className="flex flex-col gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  disabled={mutation.isPending}
                  className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </DashboardCard>
        </div>

        <DashboardCard
          title="AI Admin Assistant"
          className="lg:col-span-3"
          contentClassName="flex h-[620px] flex-col p-0"
        >
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Bot className="size-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-3 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/50 bg-muted/30"
                  )}
                >
                  {message.blocked && (
                    <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3.5" />
                      Query blocked: {message.reason ?? "security guard"}
                    </div>
                  )}
                  {message.role === "assistant" ? (
                    <Markdown content={message.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <UserIcon className="size-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {mutation.isPending && (
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border/50 p-4">
            {error && (
              <p className="mb-2 text-xs font-medium text-red-500">{error}</p>
            )}
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={2}
                placeholder="Ask about users, revenue, AI usage, system health, security..."
                className="flex-1 resize-none rounded-xl border border-border/50 bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-3 focus:ring-primary/10"
              />
              <Button type="submit" disabled={!input.trim() || mutation.isPending} className="h-10 rounded-xl">
                <Send className="size-4" />
                Send
              </Button>
            </form>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <RoleGuard roles={["ADMIN"]} fallback={null}>
      <AdminAssistantContent />
    </RoleGuard>
  );
}
