"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User,
  ShieldCheck,
  Download,
  Share2,
  Info
} from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import QRCode from "qrcode";

interface TicketDetail {
  id: string;
  status: string;
  amount: number;
  currency: string;
  scannedAt: string | null;
  createdAt: string;
  plan: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    locationName: string | null;
    city: { name: string };
    creator: { name: string | null; image: string | null };
  };
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/tickets/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTicket(data);
        if (data?.id) {
          QRCode.toDataURL(data.id, {
            width: 400,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          }).then(setQrCodeUrl);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-[var(--os-muted)]">Chargement du billet...</div>;
  if (!ticket) return <div className="p-6 text-[var(--os-muted)]">Billet introuvable.</div>;

  return (
    <AnimatedPage>
      <div className="p-6 pb-32 space-y-8 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-[var(--os-card)] text-[var(--os-fg)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            <button className="p-2.5 rounded-xl bg-[var(--os-card)] text-[var(--os-fg)]">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="p-2.5 rounded-xl bg-[var(--os-card)] text-[var(--os-fg)]">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          {/* Ticket Shape Decorator */}
          <div className="os-card p-8 space-y-6 relative overflow-hidden bg-white text-black">
            <div className="absolute top-0 left-0 w-full h-2 bg-outside-500" />
            
            <div className="space-y-1">
              <h1 className="text-xl font-black uppercase tracking-tight leading-tight">
                {ticket.plan.title}
              </h1>
              <p className="text-xs font-bold text-outside-500 uppercase">Billet Officiel OUTSIDE</p>
            </div>

            <div className="flex justify-center py-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              {ticket.scannedAt ? (
                <div className="h-[200px] w-[200px] flex flex-col items-center justify-center gap-4 text-gray-400">
                  <ShieldCheck className="h-16 w-16" />
                  <p className="font-bold text-sm">BILLET UTILISÉ</p>
                  <p className="text-[10px] uppercase">
                    Le {format(new Date(ticket.scannedAt), "d MMMM 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              ) : qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code Ticket" className="h-[200px] w-[200px]" />
              ) : (
                <div className="h-[200px] w-[200px] bg-gray-100 animate-pulse rounded-lg" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Date</p>
                <p className="font-bold">{format(new Date(ticket.plan.startDate), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Heure</p>
                <p className="font-bold">{format(new Date(ticket.plan.startDate), "HH:mm")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Lieu</p>
                <p className="font-bold truncate">{ticket.plan.locationName || ticket.plan.city.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Prix</p>
                <p className="font-bold">{ticket.amount}{ticket.currency.toUpperCase()}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Organisateur</p>
                  <p className="text-xs font-bold">{ticket.plan.creator.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-gray-400 uppercase">N° Billet</p>
                <p className="text-[10px] font-mono font-bold">{ticket.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
          </div>
          
          {/* Decorative notches */}
          <div className="absolute top-1/2 -left-4 w-8 h-8 rounded-full bg-[var(--os-bg)] -translate-y-1/2" />
          <div className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-[var(--os-bg)] -translate-y-1/2" />
        </div>

        <div className="os-card p-4 flex gap-4 bg-outside-500/10 border-outside-500/20">
          <Info className="h-5 w-5 text-outside-500 shrink-0" />
          <p className="text-xs text-[var(--os-muted)] leading-relaxed">
            Présentez ce QR Code à l&apos;entrée. Le personnel scannera votre billet pour valider votre accès.
          </p>
        </div>

        <button 
          onClick={() => router.push(`/plans/${ticket.plan.id}`)}
          className="w-full py-4 bg-[var(--os-card)] text-[var(--os-fg)] rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          Voir les détails de l&apos;événement
        </button>
      </div>
    </AnimatedPage>
  );
}
