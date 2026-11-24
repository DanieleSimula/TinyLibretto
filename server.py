"""Server di test per TinyLibretto.

Uso:  python server.py          (porta 8000)
      python server.py 8080     (altra porta)

Serve la cartella del progetto, apre il browser e stampa anche l'indirizzo
per provarla dal telefono sulla stessa rete Wi-Fi.
Ctrl+C per fermarlo.
"""
import http.server
import os
import socket
import sys
import webbrowser

PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
CARTELLA = os.path.dirname(os.path.abspath(__file__))


class SenzaCache(http.server.SimpleHTTPRequestHandler):
    # Niente cache HTTP, così ogni ricarica prende i file appena modificati
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def ip_locale():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # non invia nulla, serve solo a scoprire l'IP
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return None


os.chdir(CARTELLA)
server = http.server.ThreadingHTTPServer(("0.0.0.0", PORTA), SenzaCache)

print(f"TinyLibretto in esecuzione")
print(f"  PC:       http://localhost:{PORTA}/")
ip = ip_locale()
if ip:
    print(f"  Telefono: http://{ip}:{PORTA}/  (stessa rete Wi-Fi)")
print("Nota: il service worker resta in cache. Se non vedi le modifiche,")
print("      aumenta la versione in sw.js o ricarica forzando (Ctrl+Shift+R).")
print("Ctrl+C per fermare.\n")

webbrowser.open(f"http://localhost:{PORTA}/")
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nServer fermato.")
