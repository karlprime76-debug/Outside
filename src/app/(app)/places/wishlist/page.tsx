"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/ui/animated-page";
import { PageHeader } from "@/components/ui/page-header";
import { WishlistButton } from "@/components/wishlist-button";
import { Heart, MapPin, Users } from "lucide-react";

interface WishlistItem {
  id: string;
  note: string | null;
  createdAt: string;
  place: {
    id: string;
    name: string;
    category: string;
    neighborhood: string | null;
    priceLevel: string | null;
    isPartner: boolean;
    city: { name: string };
  };
}

interface FriendWishlistItem extends WishlistItem {
  user: { id: string; name: string | null; username: string | null; image: string | null };
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendWishlist, setFriendWishlist] = useState<FriendWishlistItem[]>([]);
  const [friendWishlistLoading, setFriendWishlistLoading] = useState(true);

  useEffect(() => {
    fetch("/api/places/wishlist")
      .then((r) => r.json())
      .then((data) => {
        setWishlist(data.wishlist || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/friends/wishlist")
      .then((r) => r.json())
      .then((data) => {
        setFriendWishlist(data.wishlist || []);
        setFriendWishlistLoading(false);
      })
      .catch(() => setFriendWishlistLoading(false));
  }, []);

  return (
    <AnimatedPage className="p-4 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Ma wishlist"
        icon={<Heart className="h-5 w-5 text-white" />}
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aucun lieu wishlisté"
          description="Ajoute des lieux à ta wishlist pour les retrouver facilement et proposer des plans avec tes amis."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {wishlist.map((item) => (
            <div key={item.id} className="os-card p-5 shadow-card relative card-hover">
              <div className="flex gap-2 mb-3">
                <Badge variant="orange">{item.place.category}</Badge>
                {item.place.isPartner && <Badge variant="pink">Partenaire</Badge>}
              </div>
              <Link href={`/places/${item.place.id}`} className="block">
                  <h3 className="font-bold text-[var(--os-fg)] mb-1 hover:text-outside-600 dark:hover:text-outside-400 transition-colors">
                    {item.place.name}
                  </h3>
              </Link>
              <p className="text-sm text-[var(--os-muted)] mb-3">
                <MapPin className="h-3 w-3 inline mr-1" />
                {item.place.city.name}{item.place.neighborhood ? ` · ${item.place.neighborhood}` : ""}
              </p>
              {item.note && (
                <p className="text-xs text-[var(--os-muted)] italic mb-3">&ldquo;{item.note}&rdquo;</p>
              )}
              <div className="absolute top-3 right-3">
                <WishlistButton placeId={item.place.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {friendWishlist.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-outside-500" />
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Wishlist de mes amis</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {friendWishlist.map((item) => (
              <div key={item.id} className="os-card p-5 shadow-card card-hover">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-[var(--os-card)] overflow-hidden">
                    {item.user.image && (
                      <img src={item.user.image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[var(--os-muted)]">
                    {item.user.name || item.user.username || "Anonyme"}
                  </span>
                </div>
                <div className="flex gap-2 mb-2">
                  <Badge variant="orange">{item.place.category}</Badge>
                </div>
                <Link href={`/places/${item.place.id}`} className="block">
                <h3 className="font-bold text-[var(--os-fg)] mb-1 hover:text-outside-600 dark:hover:text-outside-400 transition-colors">
                    {item.place.name}
                  </h3>
                </Link>
                <p className="text-sm text-[var(--os-muted)]">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {item.place.city.name}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!friendWishlistLoading && friendWishlist.length === 0 && wishlist.length > 0 && (
        <p className="text-sm text-[var(--os-muted)] text-center">
          Tes amis n&apos;ont pas encore de wishlist.
        </p>
      )}
    </AnimatedPage>
  );
}
