export type Look = {
  smooth: number;
  movement: number;
  speed: number;
  fluctuations: number;
  sharpness: number;
};

export const LOOK_DEFAULT: Look = {
  smooth: 30,
  movement: 86,
  speed: 48,
  fluctuations: 64,
  sharpness: 24,
};

const KEY = "aurelius-look";

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function loadLook(): Look {
  if (typeof localStorage === "undefined") return LOOK_DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return LOOK_DEFAULT;
    const parsed = JSON.parse(raw) as Partial<Look>;
    return {
      smooth: clamp(parsed.smooth ?? LOOK_DEFAULT.smooth),
      movement: clamp(parsed.movement ?? LOOK_DEFAULT.movement),
      speed: clamp(parsed.speed ?? LOOK_DEFAULT.speed),
      fluctuations: clamp(parsed.fluctuations ?? LOOK_DEFAULT.fluctuations),
      sharpness: clamp(parsed.sharpness ?? LOOK_DEFAULT.sharpness),
    };
  } catch {
    return LOOK_DEFAULT;
  }
}

export function saveLook(look: Look) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(look));
}
