import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ReferralLandingClient from "./referral-landing-client";

interface PageProps {
  params: { code: string };
}

export default async function ReferralLandingPage({ params }: PageProps) {
  const { code } = params;
  const session = await auth();

  // Fetch referral info
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/referrals/${code}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    notFound();
  }

  const data = await response.json();

  // If user is logged in and referral was accepted, redirect to home
  if (session?.user?.id && data.success && !data.requiresAuth) {
    redirect("/home");
  }

  return (
    <ReferralLandingClient
      inviter={data.inviter}
      code={code}
      isAuthenticated={!!session?.user?.id}
    />
  );
}
