import { NextResponse } from "next/server";
import { getPlanBOptions } from "@/lib/plans/plan-b";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId } = await context.params;

    const options = await getPlanBOptions(planId, user.id);

    return NextResponse.json(options);
  } catch (error) {
    console.error("[PLAN_B_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
