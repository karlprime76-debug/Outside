"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { isStandaloneMode, isIOS, isAndroid } from "@/lib/pwa";
import { ArrowLeft, Smartphone, Share2, Download, CheckCircle } from "lucide-react";

export default function InstallPage() {
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneMode());
    setIos(isIOS());
    setAndroid(isAndroid());
  }, []);

  if (standalone) {
    return (
      <AnimatedPage className="p-6 max-w-md mx-auto space-y-6 text-center animate-slide-up">
        <div className="os-card p-8 space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-black text-[var(--os-fg)]">OUTSIDE est installée</h1>
          <p className="text-sm text-[var(--os-muted)]">
            L&apos;application est déjà sur ton écran d&apos;accueil. Profite de l&apos;expérience native.
          </p>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            Ouvrir OUTSIDE
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-6 max-w-md mx-auto space-y-6 pb-24 animate-slide-up">
      <Link href="/home" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="text-center space-y-2">
        <Smartphone className="h-10 w-10 mx-auto text-outside-500" />
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Installe OUTSIDE</h1>
        <p className="text-sm text-[var(--os-muted)]">
          Ajoute l&apos;app à ton écran d&apos;accueil pour une expérience fluide, sans barre de navigation.
        </p>
      </div>

      {ios && (
        <div className="os-card p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg)]">iPhone / iPad</h2>
          <ol className="space-y-3 text-sm text-[var(--os-fg)]">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outside-100 text-[10px] font-bold text-outside-700">1</span>
              <span>Ouvre Safari et appuie sur le bouton <Share2 className="inline h-3.5 w-3.5 mx-0.5 text-outside-500" /> Partager.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outside-100 text-[10px] font-bold text-outside-700">2</span>
              <span>Faites défiler et sélectionnez <strong>Ajouter à l&apos;écran d&apos;accueil</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outside-100 text-[10px] font-bold text-outside-700">3</span>
              <span>Appuie sur <strong>Ajouter</strong> en haut à droite.</span>
            </li>
          </ol>
        </div>
      )}

      {android && (
        <div className="os-card p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg)]">Android</h2>
          <ol className="space-y-3 text-sm text-[var(--os-fg)]">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outside-100 text-[10px] font-bold text-outside-700">1</span>
              <span>Ouvre Chrome et appuie sur le menu <strong>⋮</strong> (3 points).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outside-100 text-[10px] font-bold text-outside-700">2</span>
              <span>Sélectionne <strong>Ajouter à l&apos;écran d&apos;accueil</strong> ou <strong>Installer l&apos;application</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outside-100 text-[10px] font-bold text-outside-700">3</span>
              <span>Suis les instructions et confirme.</span>
            </li>
          </ol>
        </div>
      )}

      {!ios && !android && (
        <div className="os-card p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg)]">Ton navigateur</h2>
          <ol className="space-y-3 text-sm text-[var(--os-fg)]">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outside-100 text-[10px] font-bold text-outside-700">1</span>
              <span>Ouvre le menu du navigateur (généralement en haut à droite).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outside-100 text-[10px] font-bold text-outside-700">2</span>
              <span>Cherche <strong>Installer l&apos;application</strong> ou <strong>Ajouter à l&apos;écran d&apos;accueil</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outside-100 text-[10px] font-bold text-outside-700">3</span>
              <span>Suis les instructions.</span>
            </li>
          </ol>
        </div>
      )}

      <div className="os-card p-5 space-y-2">
        <h3 className="text-sm font-bold text-[var(--os-fg)]">Ce que tu gagnes</h3>
        <ul className="space-y-1.5 text-sm text-[var(--os-muted)]">
          <li className="flex items-center gap-2"><Download className="h-3.5 w-3.5 text-outside-500" /> Plein écran sans barre d&apos;adresse</li>
          <li className="flex items-center gap-2"><Download className="h-3.5 w-3.5 text-outside-500" /> Icône propre sur l&apos;écran d&apos;accueil</li>
          <li className="flex items-center gap-2"><Download className="h-3.5 w-3.5 text-outside-500" /> Navigation native et fluide</li>
          <li className="flex items-center gap-2"><Download className="h-3.5 w-3.5 text-outside-500" /> Notifications push accessibles</li>
        </ul>
      </div>
    </AnimatedPage>
  );
}
