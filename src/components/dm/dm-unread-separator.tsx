"use client";

export function DmUnreadSeparator() {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex-1 h-px bg-outside-200" />
      <div className="mx-3 rounded-full bg-outside-100 border border-outside-200 px-3 py-1">
        <span className="text-[10px] font-bold text-outside-600 uppercase tracking-wide">
          Nouveaux messages
        </span>
      </div>
      <div className="flex-1 h-px bg-outside-200" />
    </div>
  );
}
