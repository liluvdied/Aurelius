const ticker = "KXGOLD15M-26SEP250045-45";
const market = await (await fetch(`https://external-api.kalshi.com/trade-api/v2/markets/${ticker}`)).json();
const m = market.market ?? {};
console.log(JSON.stringify({
  status: m.status,
  result: m.result,
  expiration: m.expiration_value,
  strike: m.floor_strike,
  last: m.last_price_dollars,
  close: m.close_time,
}, null, 2));
