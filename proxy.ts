import type { NextRequest } from "next/server";
import { runSessionProxy } from "@/shared/auth/session-proxy";

/** Next.js 16 Proxy (formerly middleware): session refresh + route gate, see session-proxy.ts. */
export function proxy(request: NextRequest) {
  return runSessionProxy(request);
}

export const config = {
  matcher: [
    // Every path except Next internals, the image optimizer and the PUBLIC asset prefixes
    // (public/images, public/fonts, favicon/robots/sitemap). Never exempt by file extension:
    // a Route Handler such as /api/admin/export.xml must still hit the session gate. Server
    // Actions are POSTs to their page path, so they stay covered. Test: proxy-matcher.test.ts.
    "/((?!_next/static/|_next/image|images/|fonts/|(?:favicon\\.ico|robots\\.txt|sitemap\\.xml)$).*)",
  ],
};
