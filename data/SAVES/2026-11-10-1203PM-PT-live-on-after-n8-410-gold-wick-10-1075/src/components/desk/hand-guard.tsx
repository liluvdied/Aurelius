// HAND GUARD TOAST (Claude, Oct 9 ~10:50 PM PT, Love: "that will make me think twice, just a little banner toast thing").
// Never blocks a trade. (1) When BTC's bands go tight, one toast: the desk is sitting out. (2) When Kalshi shows a new hand
// buy while BTC is tight, one toast with her hand-trade record. Repeats the tight note at most every 30 minutes.
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHandGuard } from "@/lib/desk/fns";

const usd = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(n).toFixed(0)}`;
export function HandGuard() {
  const q = useQuery({ queryKey: ["hand-guard"], queryFn: () => getHandGuard(), refetchInterval: 20000 });
  const seen = useRef<{ tightAt: number; hand: string | null }>({ tightAt: 0, hand: null });
  useEffect(() => {
    const d: any = q.data;
    if (!d) return;
    const rec = d.week?.n ? ` Your hand trades, last 7 days: ${d.week.w}/${d.week.n} (${Math.round((100 * d.week.w) / d.week.n)}%), ${usd(d.week.p)}.` : "";
    if (d.btcTight && Date.now() - seen.current.tightAt > 30 * 60000) {
      seen.current.tightAt = Date.now();
      toast(`BTC bands are tight (σ $${d.sigma}): a line every few dollars, so the desk is sitting out until they widen.${rec}`, { duration: 15000 });
    }
    const h = d.lastHand;
    const key = h ? `${h.at}:${h.ticker}` : null;
    if (seen.current.hand === null) seen.current.hand = key ?? "";
    else if (key && key !== seen.current.hand) {
      seen.current.hand = key;
      if (d.btcTight && h.asset === "btc") toast(`Hand trade on BTC while the desk is sitting out the chop. Breathe first, babe: is this one in your rules?${rec}`, { duration: 20000 });
    }
  }, [q.data]);
  return null;
}
