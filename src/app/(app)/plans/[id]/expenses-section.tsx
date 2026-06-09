"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Avatar } from "@/components/ui/avatar";
import { Wallet, Plus, Check, X, Trash2, ChevronRight } from "lucide-react";

interface ExpenseShare {
  id: string;
  userId: string;
  amount: number;
  settled: boolean;
  user: { id: string; name: string | null; image: string | null };
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  createdAt: string;
  paidById: string;
  paidBy: { id: string; name: string | null; image: string | null };
  shares: ExpenseShare[];
}

interface Balance {
  userId: string;
  name: string | null;
  image: string | null;
  owes: number;
  isOwed: number;
  net: number;
}

export function ExpensesSection({
  planId,
  isParticipant,
  expenseCount,
}: {
  planId: string;
  isParticipant: boolean;
  expenseCount: number;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [shares, setShares] = useState<Record<string, number>>({});
  const [participants, setParticipants] = useState<{ id: string; name: string | null; image: string | null }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`/api/plans/${planId}/expenses`).then((r) => r.json()),
      fetch(`/api/plans/${planId}`).then((r) => r.json()),
    ])
      .then(([expData, planData]) => {
        if (expData.expenses) setExpenses(expData.expenses);
        if (expData.balances) setBalances(expData.balances);
        if (planData.plan?.participants) {
          const p = planData.plan.participants.map((pp: { user: { id: string; name: string | null; image: string | null } }) => pp.user);
          setParticipants(p);
          const currentUserId = session?.user?.id;
          if (currentUserId) {
            const initialShares: Record<string, number> = {};
            for (const participant of p) {
              initialShares[participant.id] = 0;
            }
            setShares(initialShares);
          }
        }
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [open, planId, session?.user?.id]);

  function distributeEqually() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    const participantIds = Object.keys(shares);
    if (participantIds.length === 0) return;
    const equal = Math.round((parsed / participantIds.length) * 100) / 100;
    const newShares: Record<string, number> = {};
    let total = 0;
    for (let i = 0; i < participantIds.length; i++) {
      const pid = participantIds[i];
      if (i === participantIds.length - 1) {
        newShares[pid] = Math.round((parsed - total) * 100) / 100;
      } else {
        newShares[pid] = equal;
        total += equal;
      }
    }
    setShares(newShares);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !amount || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const shareArray = Object.entries(shares)
        .filter((entry) => entry[1] > 0)
        .map(([userId, amount]) => ({ userId, amount }));
      if (shareArray.length === 0) {
        setError("Distribue au moins à une personne");
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/plans/${planId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), amount: parseFloat(amount), shares: shareArray }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setExpenses((prev) => [data.expense, ...prev]);
      setTitle("");
      setAmount("");
      const reset: Record<string, number> = {};
      for (const pid of Object.keys(shares)) reset[pid] = 0;
      setShares(reset);
      setShowAddForm(false);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSettle(shareId: string) {
    const res = await fetch(`/api/plans/${planId}/expenses/${expenses.find((e) => e.shares.some((s) => s.id === shareId))?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId }),
    });
    if (res.ok) {
      const data = await res.json();
      setExpenses((prev) =>
        prev.map((exp) => ({
          ...exp,
          shares: exp.shares.map((s) => (s.id === shareId ? { ...s, settled: data.share.settled } : s)),
        }))
      );
    }
  }

  async function handleDelete(expenseId: string) {
    if (!confirm("Supprimer cette dépense ?")) return;
    const res = await fetch(`/api/plans/${planId}/expenses/${expenseId}`, { method: "DELETE" });
    if (res.ok) {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    }
  }

  const currentUserId = session?.user?.id;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
      >
        <Wallet className="h-4 w-4" />
        Dépenses
        {expenseCount > 0 && (
          <span className="ml-1 rounded-full bg-outside-100 px-2 py-0.5 text-xs font-bold text-outside-700 dark:bg-outside-900/30 dark:text-outside-300">
            {expenseCount}
          </span>
        )}
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Dépenses"
      >
        {loading ? (
          <p className="text-sm text-[var(--os-muted)]">Chargement...</p>
        ) : (
          <div className="space-y-4">
            {/* Balances */}
            {balances.length > 0 && (
              <div className="rounded-xl bg-[var(--os-bg)] p-3 space-y-2">
                <p className="text-xs font-bold uppercase text-[var(--os-muted)]">Résumé</p>
                {balances
                  .filter((b) => b.net !== 0)
                  .sort((a, b) => b.net - a.net)
                  .map((b) => {
                    const isMe = b.userId === currentUserId;
                    return (
                      <div key={b.userId} className="flex items-center gap-2 text-sm">
                        <Avatar src={b.image} name={b.name} size="sm" />
                        <span className="font-semibold text-[var(--os-fg)]">
                          {isMe ? "Tu" : b.name || "Anonyme"}
                        </span>
                        {b.net > 0 ? (
                          <span className="ml-auto text-emerald-600 font-bold">
                            doit recevoir {b.isOwed.toFixed(2)} {expenses[0]?.currency || "XOF"}
                          </span>
                        ) : (
                          <span className="ml-auto text-amber-600 font-bold">
                            doit {b.owes.toFixed(2)} {expenses[0]?.currency || "XOF"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                {balances.filter((b) => b.net !== 0).length === 0 && (
                  <p className="text-xs text-[var(--os-muted)]">Tout est équilibré</p>
                )}
              </div>
            )}

            {/* Expenses list */}
            {expenses.length === 0 && !showAddForm ? (
              <p className="text-sm text-[var(--os-muted)] text-center py-4">Aucune dépense pour le moment</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[var(--os-fg)]">{exp.title}</p>
                          {(exp.paidById === currentUserId || expenses.some((e) => e.shares.some((s) => s.id))) && (
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="text-[var(--os-muted)] hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-lg font-black text-outside-600">
                          {Number(exp.amount).toFixed(2)} {exp.currency}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Avatar src={exp.paidBy.image} name={exp.paidBy.name} size="sm" />
                          <span className="text-xs text-[var(--os-muted)]">
                            Payé par {exp.paidById === currentUserId ? "toi" : exp.paidBy.name || "Anonyme"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 border-t border-[var(--os-card-border)] pt-2">
                      {exp.shares.map((share) => {
                        const isMe = share.userId === currentUserId;
                        return (
                          <div key={share.id} className="flex items-center gap-2 text-xs">
                            <Avatar src={share.user.image} name={share.user.name} size="sm" />
                            <span className="text-[var(--os-fg)]">
                              {isMe ? "Toi" : share.user.name || "Anonyme"} : {Number(share.amount).toFixed(2)} {exp.currency}
                            </span>
                            <span className={`ml-auto flex items-center gap-1 font-semibold ${share.settled ? "text-emerald-600" : "text-amber-600"}`}>
                              {share.settled ? (
                                <>
                                  <Check className="h-3 w-3" /> Payé
                                </>
                              ) : (
                                "À payer"
                              )}
                              {isParticipant && (isMe || exp.paidById === currentUserId) && (
                                <button
                                  onClick={() => handleSettle(share.id)}
                                  className="ml-1 rounded-full p-0.5 hover:bg-[var(--os-card)] transition-colors"
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            {/* Add expense button / form */}
            {isParticipant && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Ajouter une dépense
              </button>
            )}

            {isParticipant && showAddForm && (
              <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre (ex: Taxi, Restaurant)"
                  maxLength={100}
                  className="w-full rounded-lg border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-2 text-sm text-[var(--os-fg)] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-outside-500"
                />
                <div className="flex gap-2">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Montant"
                    className="flex-1 rounded-lg border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-2 text-sm text-[var(--os-fg)] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-outside-500"
                  />
                  <button
                    type="button"
                    onClick={distributeEqually}
                    className="rounded-lg border border-[var(--os-card-border)] px-3 py-2 text-xs font-bold text-[var(--os-muted)] hover:bg-[var(--os-bg)]"
                  >
                    Égal
                  </button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-[var(--os-muted)]">Distribution</p>
                  {participants.map((p) => {
                    const isMe = p.id === currentUserId;
                    return (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <Avatar src={p.image} name={p.name} size="sm" />
                        <span className="flex-1 text-[var(--os-fg)]">{isMe ? "Toi" : p.name || "Anonyme"}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={shares[p.id] || ""}
                          onChange={(e) => setShares((prev) => ({ ...prev, [p.id]: parseFloat(e.target.value) || 0 }))}
                          className="w-20 rounded-lg border border-[var(--os-card-border)] bg-[var(--os-bg)] px-2 py-1 text-xs text-right text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !title.trim() || !amount}
                    className="flex-1 rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 py-2 text-sm font-bold text-white shadow-glow disabled:opacity-50"
                  >
                    {submitting ? "..." : "Ajouter"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-lg border border-[var(--os-card-border)] px-4 py-2 text-sm font-bold text-[var(--os-muted)] hover:bg-[var(--os-bg)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
