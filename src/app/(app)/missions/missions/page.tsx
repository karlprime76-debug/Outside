"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Target } from "lucide-react";
import { OutsidePage } from "@/components/ui/outside-page";
import { OutsideHeader } from "@/components/ui/outside-header";
import { CityMissions } from "@/components/missions/city-missions";

export default function MissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) router.push("/login");
  }, [session, router]);

  return (
    <OutsidePage className="flex flex-col h-[100dvh] pb-24">
      <OutsideHeader title="Missions" />
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[var(--os-fg)] mb-2">Missions de ville</h1>
          <p className="text-sm text-[var(--os-muted)]">
            Complète des missions dans ta ville et gagne des récompenses.
          </p>
        </div>
        <CityMissions />
      </div>
    </OutsidePage>
  );
}
