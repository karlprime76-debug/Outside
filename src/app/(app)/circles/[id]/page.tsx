"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ArrowLeft, UserPlus, Trash2, User as UserIcon, Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface Member {
  id: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    activeCity: { name: string } | null;
  };
}

interface Circle {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
}

interface SearchUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export default function CircleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: circleId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [circleRes, membersRes] = await Promise.all([
        fetch(`/api/circles/${circleId}`),
        fetch(`/api/circles/${circleId}/members`)
      ]);

      if (circleRes.ok && membersRes.ok) {
        const circleData = await circleRes.json();
        const membersData = await membersRes.json();
        setCircle(circleData.circle);
        setMembers(membersData.members);
      } else {
        router.push("/circles");
      }
    } catch {
      router.push("/circles");
    } finally {
      setLoading(false);
    }
  }, [circleId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/friends?search=${q}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out existing members
        const filtered = (data.friends || []).filter(
          (f: SearchUser) => !members.some(m => m.user.id === f.id)
        );
        setSearchResults(filtered);
      }
    } catch {
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setAdding(userId);
    try {
      const res = await fetch(`/api/circles/${circleId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        loadData();
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch {
    } finally {
      setAdding(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Retirer ce membre du cercle ?")) return;

    try {
      const res = await fetch(`/api/circles/${circleId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setMembers(members.filter(m => m.user.id !== userId));
      }
    } catch {
    }
  };

  const handleDeleteCircle = async () => {
    if (!confirm("Supprimer ce cercle ? Cette action est irréversible.")) return;

    try {
      const res = await fetch(`/api/circles/${circleId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        router.push("/circles");
      }
    } catch {
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-outside-500" />
      </div>
    );
  }

  if (!circle) return null;

  const isOwner = session?.user?.id === circle.ownerId;

  return (
    <AnimatedPage>
      <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-[var(--os-card)]">
            <ArrowLeft className="h-6 w-6 text-[var(--os-fg)]" />
          </button>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={handleDeleteCircle} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-black text-[var(--os-fg)]">{circle.name}</h1>
          {circle.description && (
            <p className="text-[var(--os-muted)] mt-1">{circle.description}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Membres ({members.length})</h2>
            {isOwner && (
              <Button onClick={() => setInviteOpen(true)} size="sm" className="rounded-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-[var(--os-card)] rounded-2xl border border-[var(--os-card-border)]">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-[var(--os-bg)]">
                    {member.user.image ? (
                      <Image src={member.user.image} alt={member.user.name || ""} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-[var(--os-muted)]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-[var(--os-fg)]">{member.user.name || member.user.username}</p>
                      {member.user.id === circle.ownerId && (
                        <Badge variant="orange" className="text-[10px] px-1 py-0 h-4">Admin</Badge>
                      )}
                    </div>
                    {member.user.activeCity && (
                      <p className="text-xs text-[var(--os-muted)]">{member.user.activeCity.name}</p>
                    )}
                  </div>
                </div>
                {isOwner && member.user.id !== session?.user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.user.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomSheet open={inviteOpen} onClose={() => setInviteOpen(false)} title="Ajouter des membres">
        <div className="space-y-4 p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--os-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher parmi tes amis..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--os-bg)] border border-[var(--os-card-border)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)]"
            />
          </div>

          <div className="max-h-[40vh] overflow-y-auto space-y-2 custom-scrollbar">
            {searching ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-outside-500" />
              </div>
            ) : searchResults.length === 0 ? (
              searchQuery.length >= 2 ? (
                <p className="text-center py-8 text-[var(--os-muted)] text-sm">Aucun ami trouvé</p>
              ) : (
                <p className="text-center py-8 text-[var(--os-muted)] text-sm">Tes amis apparaîtront ici</p>
              )
            ) : (
              searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-[var(--os-card)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-[var(--os-bg)] relative">
                      {user.image ? (
                        <Image src={user.image} alt={user.name || ""} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-[var(--os-muted)] uppercase">
                          {user.name?.[0] || user.username?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-[var(--os-fg)]">{user.name || user.username}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddMember(user.id)}
                    disabled={adding === user.id}
                  >
                    {adding === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ajouter"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </BottomSheet>
    </AnimatedPage>
  );
}
