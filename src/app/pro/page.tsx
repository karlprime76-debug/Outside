"use client";

import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Briefcase, Calendar, Ticket, Video, Megaphone, ArrowRight } from "lucide-react";

export default function ProLandingPage() {
  return (
    <AnimatedPage className="p-4 max-w-3xl mx-auto space-y-8 pb-24">
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-3xl font-black text-[var(--os-fg)]">OUTSIDE Pro</h1>
        <p className="text-sm text-[var(--os-muted)] max-w-md mx-auto">
          Fais découvrir tes événements aux personnes qui veulent vraiment sortir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: Calendar, title: "Organise de grands événements", desc: "Crée des plans qui rassemblent." },
          { icon: Briefcase, title: "Publie tes affiches", desc: "Mets en avant ton lieu ou ta marque." },
          { icon: Ticket, title: "Reçois des réservations", desc: "Bientôt : gestion de billetterie." },
          { icon: Video, title: "Lance des lives officiels", desc: "Montre l’ambiance en temps réel." },
          { icon: Megaphone, title: "Sponsorise ton événement", desc: "Bientôt : mise en avant ciblée." },
        ].map((item) => (
          <div key={item.title} className="os-card p-5 space-y-2">
            <div className="rounded-lg bg-outside-50 w-fit p-2">
              <item.icon className="h-5 w-5 text-outside-600" />
            </div>
            <h3 className="font-bold text-[var(--os-fg)] text-sm">{item.title}</h3>
            <p className="text-xs text-[var(--os-muted)]">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/pro/apply"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-8 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          Créer mon espace pro
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AnimatedPage>
  );
}
