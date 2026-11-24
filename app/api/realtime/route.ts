import { handle, options, realtime } from "@/lib/server/seismic";

// Ported from api/realtime.py (Vercel Python function) so it runs on Cloudflare Workers.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(req, realtime);
}

export function OPTIONS() {
  return options();
}
