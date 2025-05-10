import os
import subprocess
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = self.path.split('?', 1)
        if len(query) != 2:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Missing URL parameter')
            return

        params = parse_qs(query[1])
        url = params.get("url", [None])[0]
        format_type = params.get("format", ["video"])[0]

        if not url:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Missing url parameter')
            return

        ext = "mp4" if format_type == "video" else "mp3"
        output_file = f"/tmp/output.%(ext)s"

        try:
            ytdlp_format = "bestaudio" if format_type == "audio" else "best"
            postprocessor_args = []
            if format_type == "audio":
                postprocessor_args = ["--extract-audio", "--audio-format", "mp3"]

            cmd = ["yt-dlp", "-f", ytdlp_format, "-o", output_file, *postprocessor_args, url]
            subprocess.run(cmd, check=True)

            actual_file = output_file.replace("%(ext)s", ext)
            with open(actual_file, "rb") as f:
                data = f.read()

            self.send_response(200)
            self.send_header("Content-Type", f"application/{ext}")
            self.send_header("Content-Disposition", f"attachment; filename=download.{ext}")
            self.end_headers()
            self.wfile.write(data)

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())
