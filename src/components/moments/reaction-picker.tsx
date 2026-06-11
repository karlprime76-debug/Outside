"use client";

import { useHaptic } from "@/hooks/use-haptic";

const EMOJIS = ["❤️", "🔥", "😂", "🙌", "😮", "😢"];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  open: boolean;
  position: { x: number; y: number };
}

export function ReactionPicker({ onSelect, onClose, open, position }: ReactionPickerProps) {
  const haptic = useHaptic();

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100]" 
        onClick={onClose}
      />
      <div
        className="fixed z-[101] flex items-center gap-1 p-1.5 bg-[var(--os-card)] border border-[var(--os-card-border)] rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-200"
        style={{ 
          left: position.x, 
          top: position.y - 60, // Position above the button
          transform: "translateX(-50%)"
        }}
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              haptic.medium();
              onSelect(emoji);
            }}
            className="text-2xl hover:scale-125 transition-transform p-1 active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
