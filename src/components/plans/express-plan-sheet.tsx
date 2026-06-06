"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Zap, Coffee, Music, Dumbbell, PartyPopper, BookOpen, Briefcase, Plane } from "lucide-react";

const EXPRESS_TEMPLATES = [
  {
    id: "coffee",
    label: "Café",
    icon: Coffee,
    mood: "FOOD",
    defaultTitle: "Café de dernière minute",
    defaultDescription: "Petit café improvisé ?",
    durationHours: 2,
  },
  {
    id: "drink",
    label: "Verre",
    icon: PartyPopper,
    mood: "PARTY",
    defaultTitle: "Verre de dernière minute",
    defaultDescription: "Un verre pour se détendre ?",
    durationHours: 3,
  },
  {
    id: "sport",
    label: "Sport",
    icon: Dumbbell,
    mood: "SPORT",
    defaultTitle: "Sport improvisé",
    defaultDescription: "Séance de sport de dernière minute ?",
    durationHours: 2,
  },
  {
    id: "music",
    label: "Musique",
    icon: Music,
    mood: "MUSIC",
    defaultTitle: "Sortie musicale",
    defaultDescription: "On va écouter de la musique ?",
    durationHours: 4,
  },
  {
    id: "chill",
    label: "Chill",
    icon: Coffee,
    mood: "CHILL",
    defaultTitle: "Moment chill",
    defaultDescription: "Se détendre un moment ?",
    durationHours: 3,
  },
  {
    id: "study",
    label: "Étude",
    icon: BookOpen,
    mood: "STUDY",
    defaultTitle: "Session d'étude",
    defaultDescription: "Bosser ensemble ?",
    durationHours: 3,
  },
  {
    id: "business",
    label: "Business",
    icon: Briefcase,
    mood: "BUSINESS",
    defaultTitle: "Meeting express",
    defaultDescription: "Réunion de dernière minute ?",
    durationHours: 2,
  },
  {
    id: "explore",
    label: "Explorer",
    icon: Plane,
    mood: "TRAVEL",
    defaultTitle: "Exploration urbaine",
    defaultDescription: "Découvrir un nouveau coin ?",
    durationHours: 4,
  },
];

interface ExpressPlanSheetProps {
  onSelectTemplate: (template: typeof EXPRESS_TEMPLATES[0]) => void;
  trigger?: React.ReactNode;
}

export function ExpressPlanSheet({ onSelectTemplate, trigger }: ExpressPlanSheetProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (template: typeof EXPRESS_TEMPLATES[0]) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Zap className="h-4 w-4" />
        Plan Express
      </Button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Créer un plan express" maxHeight="80vh">
        <div className="grid grid-cols-2 gap-3 mt-6">
          {EXPRESS_TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <Icon className="h-8 w-8 text-primary" />
                <span className="font-medium">{template.label}</span>
                <span className="text-xs text-muted-foreground">{template.durationHours}h</span>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
