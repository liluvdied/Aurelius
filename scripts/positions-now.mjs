import { heldFifteens, restingFifteens } from "../src/lib/desk/kalshi-live.server.ts";

const held = await heldFifteens();
const resting = await restingFifteens();
console.log(JSON.stringify({ held, resting }, null, 2));
