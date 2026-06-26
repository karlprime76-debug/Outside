"use client";

import { Heart, Sparkles, Sun, Coffee, Music, MapPin, Utensils, Film, TreePine, Palette, Ship, Mountain } from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import Link from "next/link";

const IDEAS = [
  { icon: Coffee, title: "Brunch en terrasse", desc: "Un café en début d'après-midi, l'occasion parfaite pour discuter sans pression." },
  { icon: Sun, title: "Pique-nique au parc", desc: "Chacun amène quelque chose. Simple, décontracté, et romantique." },
  { icon: Music, title: "Concert improvisé", desc: "Regarde qui joue près de chez toi sur OUTSIDE. La musique rapproche." },
  { icon: Utensils, title: "Dîner dans un petit resto", desc: "Un endroit que tu as repéré sur la carte. L'ambiance fait tout." },
  { icon: Film, title: "Cinéma en plein air", desc: "Les séances en extérieur sont magiques. Vérifie les événements près de toi." },
  { icon: TreePine, title: "Balade en forêt", desc: "Une randonnée légère, un peu de nature, et beaucoup de complicité." },
  { icon: Palette, title: "Musée ou galerie", desc: "Stimulez la conversation autour d'œuvres. Culturel et inspirant." },
  { icon: Mountain, title: "Coucher de soleil", desc: "Trouvez un spot avec vue. Le meilleur décor pour un premier date." },
  { icon: Ship, title: "Balade en bateau", desc: "Si vous êtes près de l'eau, une petite sortie en bateau change tout." },
  { icon: MapPin, title: "Chasse au trésor", desc: "Explorez un quartier que vous ne connaissez pas. Chaque rue est une découverte." },
];

export default function DateIdeasPage() {
  return (
    <AnimatedPage className="pb-24">
      <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="rounded-xl bg-gradient-to-br from-neon-amber to-neon-rose p-2.5 shadow-glow">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-black text-[var(--os-fg)]">Idées de date</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-neon-amber/10 via-accent-500/5 to-neon-rose/10 border border-[var(--os-card-border)] p-5 text-center">
          <Sparkles className="h-6 w-6 text-neon-amber mx-auto mb-2" />
          <h2 className="text-lg font-bold text-[var(--os-fg)] mb-1">Inspire-toi</h2>
          <p className="text-sm text-[var(--os-muted)]">
            Pas d&rsquo;idée pour un date ? Pioche parmi ces suggestions et propose-la sur OUTSIDE.
          </p>
        </div>

        <div className="grid gap-3">
          {IDEAS.map((idea, i) => (
            <div key={i} className="flex gap-4 items-start rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 hover:bg-[var(--os-card-hover)] transition-colors">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-neon-amber/20 to-neon-rose/20 flex items-center justify-center">
                <idea.icon className="h-5 w-5 text-neon-amber" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[var(--os-fg)] mb-0.5">{idea.title}</h3>
                <p className="text-xs text-[var(--os-muted)]">{idea.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/plans/new"
          className="block w-full rounded-xl bg-gradient-to-r from-neon-amber to-neon-rose py-3.5 text-center text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
        >
          Créer un plan
        </Link>
      </div>
    </AnimatedPage>
  );
}
