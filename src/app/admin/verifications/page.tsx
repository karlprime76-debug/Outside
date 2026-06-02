import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { VerificationList } from "./verification-list";

export default async function AdminVerificationsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/home");

  return <VerificationList />;
}
