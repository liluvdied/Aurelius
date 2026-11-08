import type { Setup } from "./types";

const MIN_MULTIPLE = 3.8;
const MAX_MULTIPLE = 5.2;

export function farBandProbe(setup: Setup | null): Setup | null {
  if (!setup || setup.asset !== "btc") return null;
  if (setup.pattern.kind !== "tap_reject") return null;
  const band = Math.abs(setup.pattern.band ?? 0);
  if (band < 2) return null;
  if (setup.multiple < MIN_MULTIPLE || setup.multiple > MAX_MULTIPLE) return null;
  return {
    ...setup,
    id: `${setup.id}:probe`,
    watchOnly: false,
    localConviction: Math.max(setup.localConviction, 64),
    reasons: [
      `$1 probe. Second band rejected at ${setup.pattern.band}σ, offered ${setup.multiple.toFixed(2)}×.`,
      ...setup.reasons,
    ],
  };
}
