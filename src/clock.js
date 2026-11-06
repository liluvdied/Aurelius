// Every time inside the core is UTC milliseconds. Pacific is only for the screen.

/** Offset (minutes) of a time zone from UTC at a given instant, DST-correct. */
export function zoneOffsetMin(tz, at = Date.now()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(at)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - Math.floor(at / 1000) * 1000) / 60000);
}

/** The most recent session start (e.g. 17:00 America/New_York) at or before `at`. */
export function sessionStartMs(startHour, tz, at = Date.now()) {
  const off = zoneOffsetMin(tz, at);
  const local = new Date(at + off * 60000);
  let start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), startHour) - off * 60000;
  if (start > at) start -= 24 * 3600 * 1000;
  // re-check the offset at the start itself (a DST change can sit between start and now)
  const off2 = zoneOffsetMin(tz, start);
  if (off2 !== off) start += (off - off2) * 60000;
  return start;
}

export const pacific = (ms) => new Date(ms).toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour12: true });
