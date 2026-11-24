import { handle, options, predictions } from "@/lib/server/seismic";

// Ported from api/predictions.py (Vercel Python function) so it runs on Cloudflare Workers.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(req, predictions);
}

export function OPTIONS() {
  return options();
}
