import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "AURELIUS";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#000000" },
      {
        name: "description",
        content: "Private 15-minute Kalshi desk. VWAP bands, Grok reasoner, paper fills.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <style>{`html,body{background:#000000;color:#ffffff}`}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){var N=window.WebSocket;function S(url,protocols){var sock=protocols?new N(url,protocols):new N(url);sock.addEventListener('message',function(ev){var d=ev.data;if(typeof d!=='string')return;if(d.indexOf('full-reload')!==-1||d.indexOf('styles.css')!==-1)ev.stopImmediatePropagation();},true);return sock;}S.prototype=N.prototype;S.CONNECTING=N.CONNECTING;S.OPEN=N.OPEN;S.CLOSING=N.CLOSING;S.CLOSED=N.CLOSED;window.WebSocket=S;})();",
          }}
        />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
