"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, Mic, Plus, SendHorizontal } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface DmMessageComposerProps {
  onSend: (text: string) => void;
  sending?: boolean;
}

export function DmMessageComposer({ onSend, sending }: DmMessageComposerProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { addToast } = useToast();

  function handleSubmit() {
    const t = text.trim();
    if (!t || sending) return;
    onSend(t);
    setText("");
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    setText(el.value);
  }

  function showSoonToast(label: string) {
    addToast(`${label} bientôt disponible.`, "info");
  }

  return (
    <div className="shrink-0 border-t border-[var(--os-card-border)] bg-[var(--os-bg)]/95 backdrop-blur-md px-3 py-2.5">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        {/* Left actions */}
        <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
          <button
            onClick={() => showSoonToast("Caméra")}
            className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
            aria-label="Caméra"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            onClick={() => showSoonToast("Galerie")}
            className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
            aria-label="Galerie"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Input */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Votre message..."
            rows={1}
            className="w-full resize-none rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3.5 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all max-h-[120px]"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
          {!text.trim() ? (
            <>
              <button
                onClick={() => showSoonToast("Micro")}
                className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
                aria-label="Micro"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                onClick={() => showSoonToast("Plus")}
                className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
                aria-label="Plus"
              >
                <Plus className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-outside-500 to-accent-500 p-2.5 text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60"
              aria-label="Envoyer"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
