import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/shared/config/env";
import { decidePrelaunchRoute, type PrelaunchInput } from "./prelaunch-gate";

type PrelaunchGateStepInput = Pick<PrelaunchInput, "isSignedIn" | "getRole">;

/**
 * Session proxy step (5): the prelaunch gate as a proxy answer, or `null` to let the request
 * continue. Compares the server clock with env LAUNCH_AT on every request (BR-002). The caller
 * passes its memoized, fail-closed profile lookup as `getRole` and copies the refreshed session
 * cookies onto a non-null answer.
 */
export async function prelaunchGateStep(
  request: NextRequest,
  { isSignedIn, getRole }: PrelaunchGateStepInput,
): Promise<NextResponse | null> {
  const decision = await decidePrelaunchRoute({
    pathname: request.nextUrl.pathname,
    method: request.method,
    isServerAction: request.headers.has("next-action"),
    nowMs: Date.now(),
    launchAtMs: env.LAUNCH_AT,
    isSignedIn,
    getRole,
  });
  if (decision.action === "pass") return null;
  // Same-host absolute URL, as in step (4); Next sends it as a relative Location.
  if (decision.action === "redirect") return NextResponse.redirect(new URL(decision.location, request.url));
  return NextResponse.json({ code: "prelaunch" }, { status: 403 });
}
