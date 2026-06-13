"use client";

import { AnimatedPage } from "@/components/ui/animated-page";
import { AccountDiscovery } from "@/components/moments/account-discovery";
import { TopCreatorsDiscovery } from "@/components/moments/top-creators-discovery";
import { CityActiveDiscovery } from "@/components/moments/city-active-discovery";
import { Compass } from "lucide-react";

export default function DiscoverPage() {
  return (
    <AnimatedPage className="pb-24">
      <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-black text-[var(--os-fg)]">Découvrir</h1>
        </div>
      </div>
      <div className="divide-y divide-[var(--os-card-border)]">
        <TopCreatorsDiscovery />
        <CityActiveDiscovery />
        <AccountDiscovery />
      </div>
    </AnimatedPage>
  );
}
