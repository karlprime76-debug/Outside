import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Non authentifié.", { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get("type") || undefined;

  const encoder = new TextEncoder();
  let lastCheck = Date.now();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      async function poll() {
        while (!closed) {
          try {
            const where: Record<string, unknown> = {
              recipientId: userId,
              createdAt: { gt: new Date(lastCheck) },
            };
            if (typeFilter) where.type = typeFilter;

            const notifications = await db.notification.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: 10,
            });

            if (notifications.length > 0) {
              for (const n of notifications) {
                const data = JSON.stringify({
                  id: n.id,
                  type: n.type,
                  title: n.title,
                  body: n.body,
                  createdAt: n.createdAt.toISOString(),
                  isRead: n.isRead,
                  actorName: n.actorName,
                  actorImage: n.actorImage,
                  actorId: n.actorId,
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
              lastCheck = Date.now();
            }
          } catch {
            // Connection closed
          }

          await new Promise((r) => setTimeout(r, 5_000));
        }
      }

      poll();

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
