import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
// @ts-expect-error JS plugin alongside the TS vite config
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

/** The files `src/lib/db.ts` globs — same directory, same non-recursive scope. */
function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

/**
 * Finish PGLite bootstrap during dev-server setup (before traffic). Vite awaits
 * async `configureServer` hooks. Production: `src/lib/db` kicks `ensureDbReady`
 * on import.
 *
 * Vite awaiting the hook puts this on time-to-first-render, so an app with no
 * migrations — no schema to apply — skips it entirely rather than paying for a
 * PGLite instance it never queries.
 */
function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

function tvWebhookPlugin(): Plugin {
  const file = join(process.cwd(), "data", "tv-bands.json");
  return {
    name: "app-builder:tv-webhook",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (pathOnly !== "/tv") {
          next();
          return;
        }
        if ((req.method ?? "GET").toUpperCase() === "GET") {
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true }));
          return;
        }
        if ((req.method ?? "").toUpperCase() !== "POST") {
          res.statusCode = 404;
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(chunk as Buffer));
        req.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8").slice(0, 4000);
          let body: { s?: string; symbol?: string; ticker?: string; b?: string; band?: string; p?: number; price?: number } = {};
          try {
            body = JSON.parse(raw);
          } catch {
            body = {};
          }
          mkdirSync(join(process.cwd(), "data"), { recursive: true });
          let book: { bands: Record<string, unknown>; hits: unknown[] } = { bands: {}, hits: [] };
          try {
            const parsed = JSON.parse(readFileSync(file, "utf8"));
            if (parsed && typeof parsed === "object") book = parsed;
          } catch {
            book = { bands: {}, hits: [] };
          }
          const symbol = String(body.s || body.symbol || body.ticker || "unknown");
          const band = String(body.b || body.band || "plot");
          const price = Number(body.p ?? body.price);
          const key = `${symbol}:${band}`;
          const at = new Date().toISOString();
          book.bands[key] = { symbol, band, price: Number.isFinite(price) ? price : null, raw, at };
          book.hits = [{ at, key, raw }, ...(book.hits || [])].slice(0, 40);
          writeFileSync(file, JSON.stringify(book, null, 2));
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        });
      });
    },
  };
}

/**
 * Live-preview OAuth popup — handled HERE so the agent never has to create a
 * `/auth/popup` route (and cannot break it by scaffolding a React page that
 * paints the full app shell in the popup).
 *
 * `signIn` (client.ts) opens `/auth/popup?providerId=…` in a top-level window.
 * This middleware runs before TanStack Start, calls `handleAuthPopupRequest`,
 * and returns the 302 / completion HTML. Deployed apps do not use the popup
 * (full-page OAuth redirect), so `apply: "serve"` is enough.
 */
function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      // Register immediately (not in a returned post-hook) so we run BEFORE
      // TanStack Start / the SPA HTML fallback. A model-authored
      // `src/routes/auth/popup.tsx` React page must never win this path.
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          );
          const proto = String(
            req.headers["x-forwarded-proto"] ??
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http"),
          );
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          // Ensure Host is the public preview host so Better Auth's dynamic
          // baseURL / redirect_uri match the popup origin.
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          // Preserve multiple Set-Cookie headers (OAuth state + session).
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

function deskBootPlugin(): Plugin {
  return {
    name: "aurelius-desk-boot",
    apply: "serve",
    async configureServer(server) {
      try {
        await server.ssrLoadModule("/src/lib/desk/engine.ts");
      } catch (err) {
        console.error("[desk] engine failed to start:", err);
      }
    },
  };
}

function stillDesk(): Plugin {
  return {
    name: "desk-still",
    apply: "serve",
    handleHotUpdate(ctx) {
      const file = ctx.file.replace(/\\/g, "/");
      if (/\/(data|spine|artifacts|attachments|screenshots|\.grok)\//.test(file)) return [];
      if (!file.includes("/src/lib/")) return;
      const kept = ctx.modules.filter((mod) => {
        const id = `${mod.id || ""} ${mod.url || ""}`;
        return !id.includes("styles.css") && !id.includes(".css");
      });
      return kept.length === ctx.modules.length ? undefined : kept;
    },
  };
}

function stopFullReload(): Plugin {
  return {
    name: "desk-stop-full-reload",
    apply: "serve",
    configureServer(server) {
      const wrap = (channel: { send: (...args: unknown[]) => unknown }) => {
        const tagged = channel as { send: (...args: unknown[]) => unknown; __deskWrapped?: boolean };
        if (!tagged || typeof tagged.send !== "function" || tagged.__deskWrapped) return;
        const orig = tagged.send.bind(channel);
        tagged.send = (...args: unknown[]) => {
          const payload = args.find((item) => item && typeof item === "object" && "type" in (item as object));
          if (payload && (payload as { type?: string }).type === "full-reload") return;
          return orig(...args);
        };
        tagged.__deskWrapped = true;
      };
      wrap(server.ws as { send: (...args: unknown[]) => unknown });
      const envs = (server as unknown as { environments?: Record<string, { hot?: { send: (...args: unknown[]) => unknown } }> }).environments;
      const patch = () => {
        wrap(server.ws as { send: (...args: unknown[]) => unknown });
        if (!envs) return;
        for (const env of Object.values(envs)) if (env?.hot) wrap(env.hot);
      };
      patch();
      setTimeout(patch, 500);
      setTimeout(patch, 2000);
    },
  };
}

function quietDisconnects(): Plugin {
  return {
    name: "desk-quiet-disconnects",
    apply: "serve",
    configureServer(server) {
      const gone = (err: unknown): boolean => {
        const bits: string[] = [];
        let current: unknown = err;
        for (let i = 0; i < 4 && current; i += 1) {
          if (typeof current === "string") {
            bits.push(current);
            break;
          }
          if (typeof current !== "object") break;
          const row = current as { code?: unknown; message?: unknown; cause?: unknown };
          if (row.code != null) bits.push(String(row.code));
          if (row.message != null) bits.push(String(row.message));
          current = row.cause;
        }
        return /aborted|ECONNRESET|EPIPE|ERR_STREAM_PREMATURE_CLOSE/i.test(bits.join(" "));
      };
      process.on("unhandledRejection", (reason) => {
        if (gone(reason)) return;
        console.error(reason);
      });
      server.httpServer?.on("clientError", (err, socket) => {
        if (!gone(err)) return;
        socket.destroy();
      });
      const write = console.error;
      console.error = (...args: unknown[]) => {
        if (args.some((item) => gone(item))) return;
        write.apply(console, args as []);
      };
    },
  };
}

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    watch: {
      ignored: [
        "**/.git/**",
        "**/node_modules/**",
        "**/data/**",
        "**/spine/**",
        "**/artifacts/**",
        "**/attachments/**",
        "**/screenshots/**",
        "**/.secrets/**",
        "**/.grok/**",
      ],
    },
    // Keep the hot-reload socket up. A dropped socket used to reload the
    // whole desk. Pings stay frequent so the preview does not treat it as idle.
    hmr: { overlay: false, timeout: 120000 },
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    pgliteBootstrapPlugin(),
    tvWebhookPlugin(),
    // Before tanstackStart so /auth/popup never falls through to the SPA.
    authPopupPlugin(),
    // Dev-only /__app-env, read by scripts/check-auth-invariant.mjs.
    appEnvPlugin(),
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    grokPwaPlugin(),
    quietDisconnects(),
    deskBootPlugin(),
    tailwindcss(),
    stillDesk(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
          }),
        ]
      : []),
    viteReact(),
    stopFullReload(),
  ],
}));
