"use client";

import { useState, useEffect } from "react";

interface Comment {
  id: string;
  content: string;
  user: {
    name: string | null;
    username: string | null;
  };
}

interface LiveCommentsProps {
  momentId: string;
}

export function LiveComments({ momentId }: LiveCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    // Initial fetch
    fetch(`/api/moments/${momentId}/comments?limit=3`)
      .then(r => r.json())
      .then(data => {
        if (data.comments) setComments(data.comments.slice(0, 2).reverse());
      });

    // In a real app, we would use WebSockets/Pusher here for "live"
    // For now, let's simulate with polling or just show the latest
    const interval = setInterval(() => {
      fetch(`/api/moments/${momentId}/comments?limit=2`)
        .then(r => r.json())
        .then(data => {
          if (data.comments) setComments(data.comments.reverse());
        });
    }, 10000); // Poll every 10s for demo purposes

    return () => clearInterval(interval);
  }, [momentId]);

  if (comments.length === 0) return null;

  return (
    <div className="space-y-1.5 pointer-events-none">
      {comments.map((comment, i) => (
        <div 
          key={comment.id}
          className="animate-in slide-in-from-left-2 fade-in duration-500"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
            <span className="text-[10px] font-bold text-white/90">
              {comment.user.username || comment.user.name || "Anonyme"}
            </span>
            <span className="text-[10px] text-white/80 truncate max-w-[150px]">
              {comment.content}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
