"use client";

import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { ArrowLeft, Briefcase, CheckCircle, Globe, CalendarDays, TrendingUp, Star, Building2 } from "lucide-react";

export default function ProPage() {
  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-8 pb-24 md:pb-4 animate-slide-up">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 p-8 text-white shadow-glow animate-fade-in">
        <div className="relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-black">OUTSIDE Pro</h1>
          <p className="mt-2 text-white/80 max-w-md">
            Les organisateurs, lieux et marques peuvent publier leurs événements et toucher les personnes qui veulent vraiment sortir.
          </p>
          <Link
            href="/pro/apply"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-outside-700 shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            Devenir Pro
          </Link>
        </div>
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Features */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-[var(--os-fg)]">Ce que tu peux faire</h2>
        {[
          { icon: CalendarDays, title: "Publier des événements", desc: "Crée et gère tes événements en quelques clics." },
          { icon: Globe, title: "Toucher ta ville", desc: "Atteins les personnes actives dans ta ville." },
          { icon: TrendingUp, title: "Visibilité maximale", desc: "Tes événements apparaissent dans la carte vivante." },
          { icon: Star, title: "Badges vérifiés", desc: "Gagne la confiance avec un badge Pro." },
        ].map((f, i) => (
          <div key={i} className={`os-card p-5 flex items-start gap-4 card-hover animate-slide-up animate-stagger-${Math.min(i+1, 6)}`}>
            <div className="h-10 w-10 rounded-xl bg-outside-100 flex items-center justify-center shrink-0">
              <f.icon className="h-5 w-5 text-outside-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--os-fg)]">{f.title}</h3>
              <p className="text-xs text-[var(--os-muted)] mt-1">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Venue CTA */}
      <div className="os-card p-6 text-center">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <Building2 className="h-5 w-5 text-emerald-600" />
        </div>
        <h2 className="text-lg font-black text-[var(--os-fg)] mb-2">Tu gères un lieu ?</h2>
        <p className="text-sm text-[var(--os-muted)] mb-4">
          Bar, restaurant, rooftop, salle... Fais vérifier ton lieu et obtiens le badge &quot;Lieu vérifié&quot;.
        </p>
        <Link
          href="/pro/venue/apply"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          <CheckCircle className="h-4 w-4" />
          Vérifier mon lieu
        </Link>
      </div>

      {/* CTA */}
      <div className="os-card p-6 text-center">
        <h2 className="text-lg font-black text-[var(--os-fg)] mb-2">Tu es organisateur ?</h2>
        <p className="text-sm text-[var(--os-muted)] mb-4">
          Rejoins OUTSIDE Pro et commence à publier tes événements dès aujourd&apos;hui.
        </p>
        <Link
          href="/pro/apply"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          <CheckCircle className="h-4 w-4" />
          Postuler
        </Link>
      </div>
    </AnimatedPage>
  );
}
