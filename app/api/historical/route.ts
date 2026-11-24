import { handle, options, historical } from "@/lib/server/seismic";

// Ported from api/historical.py (Vercel Python function) so it runs on Cloudflare Workers.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(req, historical);
}

export function OPTIONS() {
  return options();
}
