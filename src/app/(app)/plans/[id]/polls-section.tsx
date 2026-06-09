"use client";

import { useState, useEffect } from "react";
import { BarChart, Plus, X, CheckCircle } from "lucide-react";

interface PollOption {
  id: string;
  label: string;
  _count: { votes: number };
  votes: { id: string }[];
}

interface Poll {
  id: string;
  question: string;
  multiple: boolean;
  isClosed: boolean;
  endsAt: string | null;
  createdAt: string;
  options: PollOption[];
}

export default function PollsSection({ planId, isParticipant, isCreator }: { planId: string; isParticipant: boolean; isCreator: boolean }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [optionsInput, setOptionsInput] = useState<string[]>(["", ""]);
  const [multiple, setMultiple] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [votingPoll, setVotingPoll] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/plans/${planId}/polls`)
      .then((r) => r.json())
      .then((data) => {
        setPolls(data.polls || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [planId]);

  async function vote(pollId: string, optionId: string) {
    setVotingPoll(pollId);
    const res = await fetch(`/api/plans/${planId}/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });

    if (res.ok) {
      const { polls: updated } = await fetch(`/api/plans/${planId}/polls`).then((r) => r.json());
      setPolls(updated || []);
    }

    setVotingPoll(null);
  }

  async function createPoll(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || optionsInput.filter((o) => o.trim()).length < 2) return;

    setSubmitting(true);
    const res = await fetch(`/api/plans/${planId}/polls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question.trim(),
        options: optionsInput.filter((o) => o.trim()).map((o) => o.trim()),
        multiple,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setPolls((prev) => [data.poll, ...prev]);
      setShowForm(false);
      setQuestion("");
      setOptionsInput(["", ""]);
      setMultiple(false);
    }

    setSubmitting(false);
  }

  async function closePoll(pollId: string) {
    await fetch(`/api/plans/${planId}/polls/${pollId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isClosed: true }),
    });

    const { polls: updated } = await fetch(`/api/plans/${planId}/polls`).then((r) => r.json());
    setPolls(updated || []);
  }

  function totalVotes(options: PollOption[]) {
    return options.reduce((sum, o) => sum + o._count.votes, 0);
  }

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)]  overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--os-card-border)] px-5 py-3">
        <BarChart className="h-4 w-4 text-outside-500" />
        <h3 className="text-sm font-bold text-[var(--os-fg)]">Sondages</h3>
      </div>

      <div className="p-4 space-y-4">
        {polls.length === 0 && !showForm && (
          <p className="text-sm text-[var(--os-muted)] text-center">Aucun sondage pour le moment.</p>
        )}

        {polls.map((poll) => {
          const total = totalVotes(poll.options);

          return (
            <div key={poll.id} className="rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[var(--os-fg)]">{poll.question}</p>
                  {poll.isClosed && (
                    <span className="text-[10px] font-bold uppercase text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">Fermé</span>
                  )}
                  {poll.multiple && !poll.isClosed && (
                    <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">Choix multiples</span>
                  )}
                </div>
                {isCreator && !poll.isClosed && (
                  <button
                    onClick={() => closePoll(poll.id)}
                    className="shrink-0 text-[var(--os-muted)] hover:text-red-500 transition-colors"
                    title="Fermer le sondage"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {poll.options.map((option) => {
                  const pct = total > 0 ? Math.round((option._count.votes / total) * 100) : 0;
                  const selected = option.votes.length > 0;

                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (!poll.isClosed && isParticipant && votingPoll !== poll.id) {
                          vote(poll.id, option.id);
                        }
                      }}
                      disabled={poll.isClosed || !isParticipant || votingPoll === poll.id}
                      className={`relative w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                        selected
                          ? "border-outside-400 bg-outside-50 dark:border-outside-600 dark:bg-outside-950/20"
                          : "border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-[var(--os-card-border)]"
                      } ${(!poll.isClosed && isParticipant) ? "cursor-pointer" : "cursor-default"} disabled:opacity-60`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-sm font-semibold text-[var(--os-fg)]">{option.label}</span>
                        <div className="flex items-center gap-1.5">
                          {selected && <CheckCircle className="h-3.5 w-3.5 text-outside-500" />}
                          <span className="text-xs font-bold text-[var(--os-muted)]">{option._count.votes} · {pct}%</span>
                        </div>
                      </div>
                      <div
                        className={`absolute inset-0 rounded-lg transition-all ${
                          selected ? "bg-outside-500/10 dark:bg-outside-500/15" : ""
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-[10px] text-[var(--os-muted)]">{total} vote{total !== 1 ? "s" : ""}</p>
            </div>
          );
        })}

        {showForm && (
          <form onSubmit={createPoll} className="rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-4 space-y-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ta question..."
              maxLength={200}
              className="w-full rounded-lg border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2 text-sm text-[var(--os-fg)] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-outside-500"
            />

            {optionsInput.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => {
                    const next = [...optionsInput];
                    next[i] = e.target.value;
                    setOptionsInput(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  maxLength={100}
                  className="flex-1 rounded-lg border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2 text-sm text-[var(--os-fg)] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-outside-500"
                />
                {optionsInput.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOptionsInput(optionsInput.filter((_, j) => j !== i))}
                    className="text-[var(--os-muted)] hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => setOptionsInput([...optionsInput, ""])}
              className="text-xs font-semibold text-outside-600 hover:text-outside-700 transition-colors"
            >
              + Ajouter une option
            </button>

            <label className="flex items-center gap-2 text-sm text-[var(--os-fg)] cursor-pointer">
              <input
                type="checkbox"
                checked={multiple}
                onChange={(e) => setMultiple(e.target.checked)}
                className="rounded border-[var(--os-card-border)] text-outside-500 focus:ring-outside-500"
              />
              Choix multiples
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || !question.trim() || optionsInput.filter((o) => o.trim()).length < 2}
                className="rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
              >
                {submitting ? "Création..." : "Créer le sondage"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setQuestion(""); setOptionsInput(["", ""]); setMultiple(false); }}
                className="rounded-lg border border-[var(--os-card-border)] px-4 py-2 text-sm font-semibold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {isParticipant && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-outside-600 hover:text-outside-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer un sondage
          </button>
        )}
      </div>
    </div>
  );
}
