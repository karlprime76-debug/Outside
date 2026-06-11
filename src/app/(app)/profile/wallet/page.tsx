"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Ticket as TicketIcon, 
  Calendar, 
  MapPin, 
  ChevronRight,
  Wallet as WalletIcon,
  QrCode
} from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SectionTitle } from "@/components/ui/section-title";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface Ticket {
  id: string;
  planId: string;
  status: string;
  amount: number;
  currency: string;
  scannedAt: string | null;
  plan: {
    id: string;
    title: string;
    startDate: string;
    locationName: string | null;
    city: { name: string };
  };
}

export default function WalletPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTickets(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AnimatedPage>
      <div className="p-6 pb-32 space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-[var(--os-card)] text-[var(--os-fg)] hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-black text-[var(--os-fg)] tracking-tight">Mon Portefeuille</h1>
        </div>

        <div className="os-card p-6 bg-gradient-to-br from-outside-500/20 to-outside-500/5 border-outside-500/20">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-outside-500 flex items-center justify-center shadow-glow">
              <WalletIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-[var(--os-muted)] font-medium">Billets actifs</p>
              <p className="text-2xl font-black text-[var(--os-fg)]">{tickets.filter(t => !t.scannedAt).length}</p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <SectionTitle title="Mes Billets" subtitle="Retrouvez vos accès pour vos prochains événements." />
          
          {loading ? (
            <div className="text-center py-12 text-[var(--os-muted)]">Chargement de vos billets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 bg-[var(--os-card)] rounded-full flex items-center justify-center mx-auto">
                <TicketIcon className="h-8 w-8 text-[var(--os-muted)]" />
              </div>
              <p className="text-[var(--os-muted)]">Vous n&apos;avez pas encore de billets.</p>
              <Link 
                href="/plans"
                className="inline-block px-6 py-3 bg-outside-500 text-white rounded-xl font-bold"
              >
                Découvrir des événements
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Link 
                  key={ticket.id}
                  href={`/profile/wallet/${ticket.id}`}
                  className="os-card p-4 flex items-center gap-4 hover:bg-[var(--os-card-hover)] transition-colors group"
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${ticket.scannedAt ? 'bg-gray-500/20' : 'bg-emerald-500/20'}`}>
                    <TicketIcon className={`h-6 w-6 ${ticket.scannedAt ? 'text-gray-500' : 'text-emerald-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--os-fg)] truncate group-hover:text-outside-500 transition-colors">
                      {ticket.plan.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[var(--os-muted)] mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(ticket.plan.startDate), "d MMMM", { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {ticket.plan.locationName || ticket.plan.city.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {ticket.scannedAt ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-500/10 text-gray-500 rounded-full border border-gray-500/20">
                        UTILISÉ
                      </span>
                    ) : (
                      <QrCode className="h-5 w-5 text-outside-500" />
                    )}
                    <ChevronRight className="h-4 w-4 text-[var(--os-muted)]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AnimatedPage>
  );
}
