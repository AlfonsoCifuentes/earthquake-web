import { handle, options, alerts } from "@/lib/server/seismic";

// Ported from api/alerts.py (Vercel Python function) so it runs on Cloudflare Workers.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(req, alerts);
}

export function OPTIONS() {
  return options();
}
