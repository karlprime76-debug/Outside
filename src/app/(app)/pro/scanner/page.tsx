"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  ShieldCheck, 
  ShieldAlert,
  Loader2,
  User as UserIcon
} from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<{ success: boolean; ticket: { user: { name: string | null; image: string | null } } | null; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    setIsCameraActive(true);
    setError(null);
    setScanResult(null);

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        // Stop scanner on success
        html5QrCode.stop().then(() => {
          setIsCameraActive(false);
          validateTicket(decodedText);
        });
      },
      () => {
        // Scanning...
      }
    ).catch((err) => {
      console.error(err);
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setIsCameraActive(false);
    });
  };

  const validateTicket = async (ticketId: string) => {
    setValidating(true);
    try {
      const r = await fetch(`/api/tickets/${ticketId}/validate`, {
        method: "POST"
      });
      const data = await r.json();
      
      if (r.ok) {
        setScanResult({
          success: true,
          ticket: data.ticket,
          message: data.message
        });
      } else {
        setScanResult({
          success: false,
          ticket: data.ticket,
          message: data.message || "Erreur lors de la validation."
        });
      }
    } catch {
      setError("Erreur réseau lors de la validation.");
    } finally {
      setValidating(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    startScanner();
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-black text-white p-6 pb-32 flex flex-col">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white/10 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-black">Scanner de Billets</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          {!isCameraActive && !scanResult && !validating && (
            <div className="text-center space-y-6">
              <div className="h-24 w-24 bg-outside-500 rounded-3xl flex items-center justify-center mx-auto shadow-glow animate-pulse">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black">Prêt à scanner ?</h2>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Placez le QR Code du participant dans le cadre pour valider son entrée.
                </p>
              </div>
              <button 
                onClick={startScanner}
                className="w-full max-w-xs py-4 bg-outside-500 text-white rounded-2xl font-black text-lg shadow-glow active:scale-95 transition-all"
              >
                Activer la caméra
              </button>
            </div>
          )}

          <div id="reader" className={`w-full max-w-sm rounded-3xl overflow-hidden border-2 border-outside-500/50 ${!isCameraActive ? 'hidden' : ''}`} />

          {validating && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-outside-500 animate-spin mx-auto" />
              <p className="font-bold">Validation en cours...</p>
            </div>
          )}

          {scanResult && (
            <div className={`w-full max-w-sm p-8 rounded-3xl border-2 space-y-6 animate-in fade-in zoom-in duration-300 ${scanResult.success ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
              <div className="flex justify-center">
                {scanResult.success ? (
                  <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                    <ShieldAlert className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center space-y-1">
                <h3 className={`text-xl font-black ${scanResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {scanResult.success ? "Entrée Autorisée" : "Entrée Refusée"}
                </h3>
                <p className="text-sm text-gray-400">{scanResult.message}</p>
              </div>

              {scanResult.ticket && (
                <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                    {scanResult.ticket.user.image ? (
                      <img src={scanResult.ticket.user.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Participant</p>
                    <p className="font-bold">{scanResult.ticket.user.name || "Utilisateur anonyme"}</p>
                  </div>
                </div>
              )}

              <button 
                onClick={resetScanner}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all"
              >
                Scanner un autre billet
              </button>
            </div>
          )}

          {error && (
            <div className="text-center space-y-4">
              <p className="text-red-400 font-bold">{error}</p>
              <button 
                onClick={startScanner}
                className="px-6 py-2 bg-white/10 rounded-xl font-bold"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
