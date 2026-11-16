import type { NextRequest } from "next/server";
import { z } from "zod";
import { getKudoForEdit } from "@/features/kudos-authoring/server/kudo-edit-query";
import { requestLocale } from "@/features/kudos-authoring/server/request-locale";
import { kudoErrorResponse, requireApiSunner } from "@/features/kudos-authoring/server/require-api-sunner";

type EditRouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/kudos/{id}/edit → 200 KudoEditPrefill (owner only; `locked: true` for a spam Kudo).
 * 401 no session · 403 FORBIDDEN (not the owner) / ONBOARDING_REQUIRED · 404 NOT_FOUND (unknown or
 * malformed id) · 500 UNEXPECTED. Error bodies are `{ code }` only: no Kudo content leaks.
 * Every answer is per-user (signed image URLs, the anonymous nickname), so none may be stored by
 * a shared or browser cache: `Cache-Control: private, no-store` (review S2).
 */
export async function GET(request: NextRequest, context: EditRouteContext) {
  const response = await loadPrefill(request, context);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function loadPrefill(request: NextRequest, { params }: EditRouteContext): Promise<Response> {
  const sunner = await requireApiSunner();
  if (sunner instanceof Response) return sunner;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return kudoErrorResponse("NOT_FOUND");

  try {
    const lookup = await getKudoForEdit(id, sunner.userId, requestLocale(request));
    if (lookup.status === "not_found") return kudoErrorResponse("NOT_FOUND");
    if (lookup.status === "forbidden") return kudoErrorResponse("FORBIDDEN");
    return Response.json(lookup.prefill);
  } catch (error) {
    console.error("[kudos] loading a kudo for edit failed", error);
    return kudoErrorResponse("UNEXPECTED");
  }
}
