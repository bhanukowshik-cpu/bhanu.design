#!/usr/bin/env python3
"""
Local proxy for chat-test.html.
  /api/chat        → Anthropic Messages API  (streaming SSE)
  /api/transcribe  → OpenAI Whisper API      (audio → text)

Run once: python3 proxy.py
Then open http://localhost:8080/chat-test.html
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error


def load_dotenv():
    """Load KEY=VALUE pairs from a sibling .env into os.environ (no overwrite)."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip())
    except FileNotFoundError:
        pass


load_dotenv()


class ProxyHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"  {args[0]} {args[1]}")

    def send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-OpenAI-Key")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors()
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/chat":
            self.handle_chat()
        elif self.path == "/api/transcribe":
            self.handle_transcribe()
        else:
            self.send_response(404)
            self.end_headers()

    # ── Anthropic chat (streaming) ─────────────────────────────────────────────

    def handle_chat(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))

        # Accept key from request body (chat-test.html) or env var (index.html)
        api_key = body.pop("apiKey", "") or os.environ.get("ANTHROPIC_API_KEY", "")
        payload = json.dumps(body).encode()

        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=payload,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req) as resp:
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Cache-Control", "no-cache")
                self.send_cors()
                self.end_headers()
                while True:
                    chunk = resp.read(256)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    self.wfile.flush()
        except urllib.error.HTTPError as e:
            err_body = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.send_cors()
            self.end_headers()
            self.wfile.write(err_body)
        except Exception as e:
            msg = json.dumps({"error": {"message": str(e)}}).encode()
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_cors()
            self.end_headers()
            self.wfile.write(msg)

    # ── OpenAI Whisper (audio transcription) ──────────────────────────────────

    def handle_transcribe(self):
        """Pass multipart audio body through to Whisper as-is."""
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        # Accept key from header (chat-test.html) or env var (index.html)
        api_key = self.headers.get("X-OpenAI-Key", "") or os.environ.get("OPENAI_API_KEY", "")
        content_type = self.headers.get("Content-Type", "")

        req = urllib.request.Request(
            "https://api.openai.com/v1/audio/transcriptions",
            data=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": content_type,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req) as resp:
                result = resp.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_cors()
                self.end_headers()
                self.wfile.write(result)
        except urllib.error.HTTPError as e:
            err_body = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.send_cors()
            self.end_headers()
            self.wfile.write(err_body)
        except Exception as e:
            msg = json.dumps({"error": {"message": str(e)}}).encode()
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_cors()
            self.end_headers()
            self.wfile.write(msg)


if __name__ == "__main__":
    port = 3001
    server = HTTPServer(("localhost", port), ProxyHandler)
    print(f"\n  Bhanu AI proxy running → http://localhost:{port}")
    print("  Endpoints: /api/chat (Anthropic) · /api/transcribe (Whisper)")
    print("  Open http://localhost:8080/chat-test.html\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Proxy stopped.")
