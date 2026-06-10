"use client";

import { useState } from "react";
import { Activity, ImageIcon, UserPlus, Calendar } from "lucide-react";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";

export interface ActivityItem {
  id: string;
  type: "moment" | "plan_created" | "plan_joined" | "friend";
  label: string;
  timestamp: string;
  link?: string;
  image?: string;
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  switch (type) {
    case "moment":
      return <ImageIcon className="h-4 w-4" />;
    case "plan_created":
    case "plan_joined":
      return <Calendar className="h-4 w-4" />;
    case "friend":
      return <UserPlus className="h-4 w-4" />;
  }
}

function timeAgo(iso: string, justNow: string, minutes: string, hours: string, days: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return justNow;
  if (mins < 60) return `${mins}${minutes}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${hours}`;
  const d = Math.floor(hrs / 24);
  return `${d}${days}`;
}

export function ProfileActivity({
  initial,
  noActivity,
  noActivityDesc,
  justNow,
  minutes,
  hours,
  days,
}: {
  initial: ActivityItem[];
  noActivity: string;
  noActivityDesc: string;
  justNow: string;
  minutes: string;
  hours: string;
  days: string;
}) {
  const [items] = useState<ActivityItem[]>(initial);

  if (items.length === 0) {
    return <OutsideEmptyState icon={Activity} title={noActivity} description={noActivityDesc} />;
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 rounded-xl p-3 hover:bg-[var(--os-card-border)]/30 transition-colors">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-outside-100 text-outside-600 dark:bg-outside-900/30 dark:text-outside-400">
            <ActivityIcon type={item.type} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--os-fg)]">{item.label}</p>
            <p className="text-xs text-[var(--os-muted)]">{timeAgo(item.timestamp, justNow, minutes, hours, days)}</p>
          </div>
          {item.image && (
            <img src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
          )}
        </div>
      ))}
    </div>
  );
}
