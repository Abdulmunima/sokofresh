import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except build assets, the service worker, images and the manifest.
    "/((?!_next/static|_next/image|serwist/|icons/|manifest.webmanifest|.*\\.(?:png|svg|ico|jpg|jpeg|webp)$).*)",
  ],
};
