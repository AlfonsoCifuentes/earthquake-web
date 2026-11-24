import { handle, options, clusters } from "@/lib/server/seismic";

// Ported from api/clusters.py (Vercel Python function) so it runs on Cloudflare Workers.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(req, clusters);
}

export function OPTIONS() {
  return options();
}
