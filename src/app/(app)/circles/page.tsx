"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";

interface Circle {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
  createdAt: string;
}

export default function CirclesPage() {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDescription, setNewCircleDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    try {
      const res = await fetch("/api/circles");
      if (res.ok) {
        const data = await res.json();
        setCircles(data.circles || []);
      }
    } catch {
      setCircles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCircleName,
          description: newCircleDescription || null,
        }),
      });

      if (res.ok) {
        setNewCircleName("");
        setNewCircleDescription("");
        setCreateOpen(false);
        loadCircles();
      }
    } catch {
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Cercles de sortie</h1>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Créer
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[var(--os-card)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : circles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-[var(--os-muted)] mb-4" />
            <p className="text-[var(--os-muted)]">Aucun cercle créé</p>
            <p className="text-sm text-[var(--os-muted)] mt-1">Crée tes premiers cercles pour organiser tes sorties</p>
          </div>
        ) : (
          <div className="space-y-3">
            {circles.map((circle) => (
              <button
                key={circle.id}
                onClick={() => router.push(`/circles/${circle.id}`)}
                className="w-full text-left p-4 bg-[var(--os-card)] rounded-2xl hover:border-[var(--os-card-border)] border border-transparent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--os-fg)]">{circle.name}</h3>
                    {circle.description && (
                      <p className="text-sm text-[var(--os-muted)] mt-1">{circle.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="slate" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {circle._count.members} membre{circle._count.members > 1 ? "s" : ""}
                      </Badge>
                      <span className="text-xs text-[var(--os-muted)]">
                        Créé le {new Date(circle.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)} title="Créer un cercle">
        <div className="space-y-4 p-2">
          <div>
            <label className="text-sm font-semibold text-[var(--os-fg)]">Nom du cercle</label>
            <input
              type="text"
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
              placeholder="Ex: Mes amis food"
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--os-bg)] border border-[var(--os-card-border)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--os-fg)]">Description (optionnel)</label>
            <textarea
              value={newCircleDescription}
              onChange={(e) => setNewCircleDescription(e.target.value)}
              placeholder="Ex: Gens pour sortir manger ensemble"
              rows={3}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--os-bg)] border border-[var(--os-card-border)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] resize-none"
            />
          </div>
          <Button
            onClick={handleCreateCircle}
            disabled={!newCircleName.trim() || creating}
            className="w-full"
          >
            {creating ? "Création..." : "Créer le cercle"}
          </Button>
        </div>
      </BottomSheet>
    </AnimatedPage>
  );
}
