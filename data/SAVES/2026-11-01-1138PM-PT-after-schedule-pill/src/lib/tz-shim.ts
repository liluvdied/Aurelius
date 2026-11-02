// TIME-ZONE SHIM (Claude, Oct 13 ~5:30 AM PT, Love: "desk is down", screen read "invalid time zone: America/Los_Angeles").
// After Safari reloads a crashed tab it can start refusing named time zones, and every Pacific-time label on the desk threw,
// taking the whole screen down. Any date format asked for a time zone it suddenly can't load now falls back to the Mac's own
// clock (which is Pacific) instead of crashing. Loaded before the desk.
if (typeof window !== "undefined" && typeof Intl !== "undefined" && !(window as any).__tzShim) {
  (window as any).__tzShim = true;
  const strip = (o: any) => {
    if (!o || typeof o !== "object" || !("timeZone" in o)) return o;
    const c = { ...o };
    delete c.timeZone;
    return c;
  };
  const Orig = Intl.DateTimeFormat;
  const Safe: any = function (locales?: any, options?: any) {
    try {
      return new Orig(locales, options);
    } catch (e) {
      if (e instanceof RangeError && options && options.timeZone) return new Orig(locales, strip(options));
      throw e;
    }
  };
  Safe.prototype = Orig.prototype;
  Safe.supportedLocalesOf = Orig.supportedLocalesOf.bind(Orig);
  try { (Intl as any).DateTimeFormat = Safe; } catch {}
  for (const m of ["toLocaleString", "toLocaleDateString", "toLocaleTimeString"]) {
    const orig = (Date.prototype as any)[m];
    (Date.prototype as any)[m] = function (this: Date, l?: any, opt?: any) {
      try {
        return orig.call(this, l, opt);
      } catch (e) {
        if (e instanceof RangeError && opt && opt.timeZone) return orig.call(this, l, strip(opt));
        throw e;
      }
    };
  }
}
export {};
