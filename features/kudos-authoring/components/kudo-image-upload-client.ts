import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/shared/config/public-env";
import { KUDO_IMAGE_BUCKET, KUDO_IMAGE_CONTENT_TYPES, KUDO_LIMITS } from "../kudo-authoring-limits";
import type { KudoImageUploadTicket } from "../schemas/kudo-image-sign-schema";

/**
 * Browser side of the Kudo image flow (contract § 3): POST /api/kudos/images/sign → Storage
 * `uploadToSignedUrl(path, token, file)` with the anon key (the token authorizes the write).
 * The client keeps no auth session of its own, so it never touches the app's cookie session.
 */
export type ImageUploadErrorCode = "IMAGE_INVALID" | "UNAUTHENTICATED" | "WRITING_CLOSED" | "UPLOAD_LIMIT" | "UNEXPECTED";
export type ImageUploadResult = { ok: true; path: string } | { ok: false; code: ImageUploadErrorCode };

const ACCEPTED_TYPES: readonly string[] = KUDO_IMAGE_CONTENT_TYPES;

let storageClient: SupabaseClient | null = null;

function storage() {
  storageClient ??= createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return storageClient.storage.from(KUDO_IMAGE_BUCKET);
}

/** Same rule as the sign endpoint and the bucket: jpeg/png/webp, 1 byte … 5 MB. */
export function isAcceptedKudoImage(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type) && file.size > 0 && file.size <= KUDO_LIMITS.IMAGE_MAX_BYTES;
}

export function hasPreviewableType(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type);
}

async function signUpload(file: File): Promise<KudoImageUploadTicket | ImageUploadErrorCode> {
  const response = await fetch("/api/kudos/images/sign", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  if (response.status === 401) return "UNAUTHENTICATED";
  if (response.ok) return (await response.json()) as KudoImageUploadTicket;
  const { code } = (await response.json().catch(() => ({}))) as { code?: string };
  if (code === "WRITING_CLOSED" || code === "UPLOAD_LIMIT") return code;
  // PAYLOAD_TOO_LARGE (413) cannot come from this 2-field body; like any other code it is "retry".
  return code === "VALIDATION" ? "IMAGE_INVALID" : "UNEXPECTED";
}

/** Signs and uploads one file; the returned `path` goes into `imagePaths`. Never throws. */
export async function uploadKudoImage(file: File): Promise<ImageUploadResult> {
  try {
    const ticket = await signUpload(file);
    if (typeof ticket === "string") return { ok: false, code: ticket };
    const { error } = await storage().uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
    return error ? { ok: false, code: "UNEXPECTED" } : { ok: true, path: ticket.path };
  } catch {
    return { ok: false, code: "UNEXPECTED" };
  }
}
