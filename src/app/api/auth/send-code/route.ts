import { handleSendCodeHook, hookDepsFromEnv } from "@/lib/auth/send-code-hook";

// Called by Supabase Auth (Send SMS hook) each time someone asks for a login code.
export async function POST(request: Request) {
  return handleSendCodeHook(request, hookDepsFromEnv());
}
