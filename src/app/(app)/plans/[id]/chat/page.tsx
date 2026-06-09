"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { AnimatedPage } from "@/components/ui/animated-page";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ArrowLeft, Send, MessageSquare, Radio } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
}

export default function ChatPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync for comparison during polling
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      try {
        const r = await fetch(`/api/plans/${id}/messages`);
        const data = await r.json();
        if (!mounted) return;
        const newMsgs = data.messages || [];
        // Only update if different to avoid re-renders
        if (newMsgs.length !== messagesRef.current.length) {
          setMessages(newMsgs);
        }
        setOnline(true);
      } catch {
        if (mounted) setOnline(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/plans/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setInput("");
      } else if (res.status === 403) {
        addToast("Rejoins le plan pour discuter", "error");
      } else {
        addToast("Erreur d'envoi", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const currentUserId = session?.user?.id;

  return (
    <AnimatedPage className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--os-card-border)] bg-[var(--os-card)]/80 px-4 py-3 backdrop-blur">
        <Link
          href={`/plans/${id}`}
          className="rounded-lg p-1.5 hover:bg-[var(--os-bg)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--os-fg)]" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-1.5 shadow-glow">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-[var(--os-fg)]">Discussion</h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${online ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
                <Radio className="h-2.5 w-2.5" />
                {online ? "En ligne" : "Hors ligne"}
              </span>
            </div>
            <p className="text-xs text-[var(--os-muted)]">{messages.length} messages</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingScreen size="sm" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-full bg-outside-100 p-4 dark:bg-outside-950/20">
              <MessageSquare className="h-8 w-8 text-outside-500" />
            </div>
            <p className="mt-3 text-sm font-bold text-[var(--os-fg)]">
              Pas encore de messages
            </p>
            <p className="text-xs text-[var(--os-muted)]">
              Sois le premier à écrire dans ce plan !
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.author.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar
                  src={msg.author.image}
                  name={msg.author.name}
                  size="sm"
                />
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? "bg-gradient-to-br from-outside-500 to-accent-500 text-white"
                      : "bg-[var(--os-card)] border border-[var(--os-card-border)] text-[var(--os-fg)]"
                  }`}
                >
                  {!isMe && (
                    <p className="text-[11px] font-bold opacity-70 mb-0.5">
                      {msg.author.name || "Anonyme"}
                    </p>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-white/70" : "text-[var(--os-muted)]"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 border-t border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrire un message..."
          maxLength={2000}
          className="flex-1 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-4 py-2.5 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 text-white shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-40 disabled:shadow-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </AnimatedPage>
  );
}
