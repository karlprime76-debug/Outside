"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SectionTitle } from "@/components/ui/section-title";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Flame, Users, MapPin, Clock, Sparkles, Navigation, Calendar } from "lucide-react";
import type { Plan } from "@/types/plan";

interface UserStatus {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  activeCity: { name: string } | null;
}

interface PlanWithPlace extends Plan {
  place?: { name: string } | null;
}

interface Moment {
  id: string;
  mediaUrl: string;
  caption: string | null;
  author: { name: string | null; image: string | null };
  createdAt: string;
}

export default function TonightPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<UserStatus[]>([]);
  const [openPlans, setOpenPlans] = useState<PlanWithPlace[]>([]);
  const [recentMoments, setRecentMoments] = useState<Moment[]>([]);
  const [activePlaces, setActivePlaces] = useState<{ id: string; name: string; neighborhood: string | null }[]>([]);

<<<<<<< HEAD
  const loadTonightData = useCallback(async () => {
=======
  useEffect(() => {
    loadTonightData();
  }, [session]);

  async function loadTonightData() {
>>>>>>> 8c85852 (fix: clean console.log, fix eslint warnings, improve user-quality-score, integrate trip history)
    try {
      setLoading(true);

      // Get available users
      const usersRes = await fetch("/api/outside-status");
      if (usersRes.ok) {
        // Get all users with active status in the city
        const allUsersRes = await fetch(`/api/users/discover?city=${session?.user?.activeCity?.name}`);
        if (allUsersRes.ok) {
          const allUsers = await allUsersRes.json();
          setAvailableUsers(allUsers.users || []);
        }
      }

      // Get open plans
      const plansRes = await fetch("/api/plans?status=ACTIVE");
      if (plansRes.ok) {
        const data = await plansRes.json();
        setOpenPlans(data.plans || []);
      }

      // Get recent moments
      const momentsRes = await fetch("/api/moments?limit=10");
      if (momentsRes.ok) {
        const data = await momentsRes.json();
        setRecentMoments(data.moments || []);
      }

      // Get active places
      const placesRes = await fetch("/api/places");
      if (placesRes.ok) {
        const data = await placesRes.json();
        setActivePlaces(data.places || []);
      }
    } catch (error) {
      console.error("[TONIGHT_ERROR]", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.activeCity?.name]);

  useEffect(() => {
    loadTonightData();
  }, [loadTonightData]);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SectionTitle icon={<Flame className="h-5 w-5" />} title="Qui bouge ce soir ?" />
          <Button variant="secondary" size="sm" onClick={loadTonightData}>
            <Navigation className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Available Users */}
            {availableUsers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Disponibles ce soir</h3>
                  <Badge variant="outline">{availableUsers.length}</Badge>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {availableUsers.map((user) => (
                    <Link key={user.id} href={`/u/${user.username}`} className="flex-shrink-0">
                      <div className="flex flex-col items-center gap-2">
                        <Avatar src={user.image} name={user.name} size="xl" />
                        <span className="text-xs font-medium text-center max-w-[80px] truncate">
                          {user.name}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Open Plans */}
            {openPlans.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Plans ouverts</h3>
                  <Badge variant="outline">{openPlans.length}</Badge>
                </div>
                <div className="space-y-3">
                  {openPlans.slice(0, 5).map((plan) => (
                    <Link key={plan.id} href={`/plans/${plan.id}`}>
                      <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold">{plan.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{plan.city.name}</span>
                              {plan.place && <span>• {plan.place.name}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(plan.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline">{plan.mood}</Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{plan._count.participants}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Moments */}
            {recentMoments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Moments récents</h3>
                  <Badge variant="outline">{recentMoments.length}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {recentMoments.slice(0, 6).map((moment) => (
                    <div key={moment.id} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={moment.mediaUrl}
                        alt={moment.caption || "Moment"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Places */}
            {activePlaces.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Lieux actifs</h3>
                  <Badge variant="default">{activePlaces.length}</Badge>
                </div>
                <div className="space-y-2">
                  {activePlaces.slice(0, 5).map((place) => (
                    <Link key={place.id} href={`/places/${place.id}`}>
                      <div className="p-3 rounded-lg border hover:bg-accent transition-colors">
                        <div className="font-semibold">{place.name}</div>
                        {place.neighborhood && (
                          <div className="text-sm text-muted-foreground">{place.neighborhood}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!loading && availableUsers.length === 0 && openPlans.length === 0 && recentMoments.length === 0 && (
              <div className="text-center py-12">
                <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Personne ne bouge ce soir pour le moment...</p>
                <p className="text-sm text-muted-foreground mt-2">Soyez le premier à créer un plan !</p>
              </div>
            )}
          </>
        )}
      </div>
    </AnimatedPage>
  );
}
