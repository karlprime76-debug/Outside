import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { acceptReferralForUser, findInviterByCode } from "@/lib/referral";
import ReferralLandingClient from "./referral-landing-client";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function ReferralLandingPage({ params }: PageProps) {
  const { code } = await params;
  const session = await auth();
  const inviter = await findInviterByCode(code);

  if (!inviter) {
    notFound();
  }

  if (session?.user?.id) {
    const result = await acceptReferralForUser(code, session.user.id);
    if (result.ok) {
      redirect("/home");
    }
  }

  return (
    <ReferralLandingClient
      inviter={inviter}
      code={code}
      isAuthenticated={!!session?.user?.id}
    />
  );
}
