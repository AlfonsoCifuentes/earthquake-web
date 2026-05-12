"""
api/dev_server.py
Local development HTTP server — dispatches requests to the Vercel handler classes.

Usage:
    python api/dev_server.py           # listens on :8001
    python api/dev_server.py 8002      # custom port
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import sys
import os

# Make sure sibling modules are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import realtime      # noqa: E402
import historical    # noqa: E402
import predictions   # noqa: E402
import alerts        # noqa: E402
import clusters      # noqa: E402

ROUTES: dict[str, type[BaseHTTPRequestHandler]] = {
    "/api/realtime":    realtime.handler,
    "/api/historical":  historical.handler,
    "/api/predictions": predictions.handler,
    "/api/alerts":      alerts.handler,
    "/api/clusters":    clusters.handler,
}


class RouterHandler(BaseHTTPRequestHandler):
    """Routes incoming requests to the appropriate Vercel handler class."""

    def _dispatch(self, method_name: str) -> None:
        path = urlparse(self.path).path
        target = ROUTES.get(path)
        if target is None:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error":"not found"}')
            return
        # Temporarily rebind the instance to the target handler so its
        # do_GET / do_OPTIONS methods run with the correct implementation.
        original = self.__class__
        self.__class__ = target
        try:
            getattr(self, method_name)()
        finally:
            self.__class__ = original

    def do_GET(self):       self._dispatch("do_GET")
    def do_OPTIONS(self):   self._dispatch("do_OPTIONS")

    def log_message(self, fmt, *args):  # noqa: N802
        status = args[1] if len(args) > 1 else "-"
        print(f"  {status}  {self.path}")


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    server = HTTPServer(("localhost", port), RouterHandler)
    print(f"API dev server →  http://localhost:{port}")
    print("Routes:", ", ".join(ROUTES.keys()))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
