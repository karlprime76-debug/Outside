import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Cette route n'est accessible qu'en développement ou pour un admin." },
        { status: 403 }
      );
    }
  }

  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;
  const hasLivekitUrl = !!url;
  const hasApiKey = !!process.env.LIVEKIT_API_KEY;
  const hasApiSecret = !!process.env.LIVEKIT_API_SECRET;
  const urlStartsWithWss = hasLivekitUrl && url!.startsWith("wss://");

  return NextResponse.json({
    env: {
      hasLivekitUrl,
      hasApiKey,
      hasApiSecret,
      urlStartsWithWss,
    },
    message: urlStartsWithWss
      ? "Configuration LiveKit OK."
      : "NEXT_PUBLIC_LIVEKIT_URL doit commencer par wss://",
  });
}
