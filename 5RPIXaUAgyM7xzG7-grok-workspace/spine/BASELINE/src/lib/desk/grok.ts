import type { AssetSnapshot, GrokCall, Setup, Side } from "./types";
import { usd } from "./format";

export type GrokBriefing = {
  setup: Setup;
  asset: AssetSnapshot;
};

type Parsed = {
  side: Side | "pass";
  conviction: number;
  holdToExpiry: boolean;
  exitProfitPct: number;
  thesis: string;
  risks: string;
};

const SYSTEM = `You are the reasoner for AURELIUS, a private 15-minute Kalshi up/down desk.

Philosophy:
- Trade VWAP multiplier bands on the 1-minute (sniper) and 5-minute (bias) frames.
- Tap-and-reject at a band → fade that tag (buy the opposite side of the wick).
- Blow-through a band, retest, continue → trade with the continuation.
- Prefer the safest high-probability side, not lottery tickets.
- Accept entries from 1.34× to about 2.2×. Premium multiples (3×+) only with a clean band story.
- Do not take a thin multiple while the window is young. Above 10 minutes, 1.4× is early — wait for a better price. Less time left and a better multiple is the better trade, because a reversal has less room.
- Exception: if the window just opened and price is already on a VWAP band at about 1.8× or better, take it. That is the entry.
- The last two minutes at about 1.4× is a gold trade when price is clearly through the strike. Do not hunt that clock on bitcoin.
- On a 2×, bank at 80% profit. Do it every time. Do not hold that one for the bell.
- Bank at 59% when the contract can pay it. If the max profit is 70% or less, leave 10 points on the table, so a 65% max banks at 55%. If less than $5 is left to the max payout, sell immediately.
- Bitcoin only: if price is already $300 through the strike, a nearby band is not a reason to sell early. Let that one go until the profit target, or until it comes back through the strike.
- Gold is the opposite. A VWAP band can take $5 away in two seconds. If gold is green on the real bid by at least 50% and price is on a band, bank it. Do not sell a gold winner into a wide book just because the screen looks extended.
- A trade that is green does not get to settle red. With three minutes left, if it is not far through the strike, bank it. If it crosses back through the strike while green, bank it.
- A 10% add is allowed only on the same side, after the multiple improves, with price still safe of VWAP.
- If the setup is shaky, say pass. Do not force a trade.
- Small $1 paper. Never size up in this brief.

Reply with JSON only:
{
  "side": "up" | "down" | "pass",
  "conviction": 0-100,
  "holdToExpiry": boolean,
  "exitProfitPct": 45-95,
  "thesis": "2-3 short sentences",
  "risks": "one short sentence"
}`;

function briefingText(b: GrokBriefing): string {
  const a = b.asset;
  const s = b.setup;
  const prints = a.lastPrints
    .map((p) => `${usd(p.c)} (h ${usd(p.h)} / l ${usd(p.l)})`)
    .join(" → ");
  const yesAsk = a.market?.yesAsk ?? 0;
  const noAsk = a.market?.noAsk ?? 0;
  return [
    `Asset: ${a.asset.toUpperCase()}`,
    `Spot: ${usd(a.spot)}`,
    `Kalshi target: ${a.target != null ? usd(a.target) : "n/a"}`,
    `Delta vs target: ${a.delta != null ? usd(a.delta) : "n/a"} (${a.deltaBps != null ? a.deltaBps.toFixed(1) : "n/a"} bp)`,
    `Window remaining: ${a.secondsLeft}s`,
    `Ticker: ${s.ticker}`,
    `YES/Up ask: ${(yesAsk * 100).toFixed(1)}¢ (${yesAsk > 0 ? (1 / yesAsk).toFixed(2) : "n/a"}×)`,
    `NO/Down ask: ${(noAsk * 100).toFixed(1)}¢ (${noAsk > 0 ? (1 / noAsk).toFixed(2) : "n/a"}×)`,
    `1m VWAP: ${a.vwap1m ? `${usd(a.vwap1m.vwap)} σ=${usd(a.vwap1m.stdev)} (${a.vwap1m.source})` : "n/a"}`,
    `5m VWAP: ${a.vwap5m ? `${usd(a.vwap5m.vwap)} σ=${usd(a.vwap5m.stdev)}` : "n/a"}`,
    `1m pattern: ${a.pattern1m.label} (q=${a.pattern1m.quality.toFixed(2)}) ${a.pattern1m.reasons.join(" ")}`,
    `5m pattern: ${a.pattern5m.label} (q=${a.pattern5m.quality.toFixed(2)}) ${a.pattern5m.reasons.join(" ")}`,
    `Local setup: ${s.side.toUpperCase()} ${s.multiple.toFixed(2)}× @ ${(s.ask * 100).toFixed(1)}¢ · local conviction ${s.localConviction} · watchOnly=${s.watchOnly} · throughTarget=${s.throughTarget}`,
    `Local reasons: ${s.reasons.join(" | ")}`,
    `Last 1m prints: ${prints || "n/a"}`,
    `Tape: ${a.product}`,
  ].join("\n");
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function parseSide(v: unknown): Side | "pass" {
  return v === "up" || v === "down" || v === "pass" ? v : "pass";
}

function extractJson(text: string): Parsed {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const raw = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  const obj = JSON.parse(raw) as Record<string, unknown>;
  const conviction = clamp(Number(obj.conviction) || 0, 0, 100);
  const exitProfitPct = clamp(Number(obj.exitProfitPct) || 45, 45, 95);
  return {
    side: parseSide(obj.side),
    conviction,
    holdToExpiry: Boolean(obj.holdToExpiry),
    exitProfitPct,
    thesis: String(obj.thesis ?? "").slice(0, 600),
    risks: String(obj.risks ?? "").slice(0, 280),
  };
}

export async function talkDesk(
  question: string,
  context: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "Grok is unavailable in this environment." };
  if (!underCap()) return { ok: false, error: "Grok hourly cap reached." };
  stamps.push(Date.now());
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.3,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content:
              "You are Ara, the voice on Ryan's Aurelius desk, the same assistant he talks to in the car. Answer in two short spoken sentences. No markdown, no lists. Use the desk notes. Do not invent a fill. If a note says Just did, say that first. Never close a position yourself in words only. If he did not name gold or bitcoin, do not tell him both were closed.",
          },
          { role: "user", content: `Question: ${question}\n\nDesk:\n${context.slice(0, 1800)}` },
        ],
      }),
    });
    if (!res.ok) return { ok: false, error: `xAI ${res.status}` };
    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "No answer." };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "Grok did not answer." };
  }
}

export async function speakAra(text: string): Promise<{ ok: true; audio: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "Voice is unavailable." };
  try {
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: text.slice(0, 500),
        voice_id: "ara",
        language: "en",
        output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 64000 },
      }),
    });
    if (!res.ok) return { ok: false, error: `voice ${res.status}` };
    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return { ok: true, audio: btoa(binary) };
  } catch {
    return { ok: false, error: "Ara did not speak." };
  }
}

export async function hearVoice(audioBase64: string, mime: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "Voice is unavailable." };
  if (!audioBase64 || audioBase64.length < 80) return { ok: false, error: "I didn't catch that. Talk again." };
  if (audioBase64.length > 6_000_000) return { ok: false, error: "That was too long. Say it shorter." };
  try {
    const bytes = Buffer.from(audioBase64, "base64");
    const kind = mime.includes("webm") ? "audio/webm" : mime.includes("wav") ? "audio/wav" : "audio/mp4";
    const name = kind === "audio/webm" ? "talk.webm" : kind === "audio/wav" ? "talk.wav" : "talk.m4a";
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: kind }), name);
    form.append("language", "en");
    form.append("model", "grok-voice-transcribe-2.0");
    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) return { ok: false, error: "I couldn't hear that. Try again." };
    const payload = (await res.json()) as { text?: string };
    const text = payload.text?.trim();
    if (!text) return { ok: false, error: "I didn't catch that. Talk again." };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "I couldn't hear that. Try again." };
  }
}
let stamps: number[] = [];
const memo = new Map<string, { at: number; call: GrokCall }>();

function underCap(): boolean {
  const now = Date.now();
  stamps = stamps.filter((t) => now - t < 60 * 60 * 1000);
  return stamps.length < 24;
}

export async function reasonSetup(brief: GrokBriefing): Promise<
  { ok: true; call: GrokCall; cached: boolean } | { ok: false; error: string }
> {
  const setupId = brief.setup.id;
  const hit = memo.get(setupId);
  if (hit && Date.now() - hit.at < 12 * 60 * 1000) {
    return { ok: true, call: hit.call, cached: true };
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "Grok is unavailable in this environment." };
  if (!underCap()) return { ok: false, error: "Grok hourly cap reached. Local scanner still live." };

  stamps.push(Date.now());

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: 420,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: briefingText(brief) },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `xAI ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}` };
    }
    const payload = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(text);
    const call: GrokCall = {
      at: new Date().toISOString(),
      setupId,
      ticker: brief.setup.ticker,
      side: parsed.side,
      conviction: parsed.conviction,
      holdToExpiry: parsed.holdToExpiry,
      exitProfitPct: parsed.exitProfitPct,
      thesis: parsed.thesis || "No thesis returned.",
      risks: parsed.risks || "",
      pattern: brief.setup.pattern.label,
    };
    memo.set(setupId, { at: Date.now(), call });
    return { ok: true, call, cached: false };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Grok failed." };
  }
}
