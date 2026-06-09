"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";
import { useToast } from "@/components/ui/toast";

interface WishlistButtonProps {
  placeId: string;
  className?: string;
  variant?: "icon" | "button";
}

export function WishlistButton({ placeId, className = "", variant = "icon" }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const haptic = useHaptic();
  const { addToast } = useToast();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/places/wishlist");
        if (res.ok) {
          const data = await res.json();
          const found = data.wishlist?.find((w: { placeId: string; id: string }) => w.placeId === placeId);
          if (found) {
            setWishlisted(true);
            setWishlistId(found.id);
          }
        }
      } catch {
      }
    };
    check();
  }, [placeId]);

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      if (wishlisted && wishlistId) {
        const res = await fetch(`/api/places/wishlist/${wishlistId}`, { method: "DELETE" });
        if (res.ok) {
          setWishlisted(false);
          setWishlistId(null);
          haptic.light();
          addToast("Retiré de ma wishlist", "info");
        }
      } else {
        const res = await fetch("/api/places/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placeId }),
        });
        if (res.ok) {
          const data = await res.json();
          setWishlisted(true);
          setWishlistId(data.wishlist.id);
          haptic.success();
          addToast("Ajouté à ma wishlist", "success");
        }
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "button") {
    return (
      <button
        onClick={toggleWishlist}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
          wishlisted
            ? "border-red-300 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
            : "border-[var(--os-card-border)] bg-[var(--os-card)] text-[var(--os-fg)] hover:border-red-300"
        } ${className}`}
      >
        <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
        {wishlisted ? "Wishlist" : "Ajouter à ma wishlist"}
      </button>
    );
  }

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`rounded-full p-2 transition-colors active:scale-95 ${
        wishlisted
          ? "bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400"
          : "bg-[var(--os-bg)] text-[var(--os-muted)] hover:bg-red-50 hover:text-red-500"
      } ${className}`}
      aria-label={wishlisted ? "Retirer de ma wishlist" : "Ajouter à ma wishlist"}
    >
      <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
    </button>
  );
}
