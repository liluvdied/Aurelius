import { dnaNow } from "./src/lib/desk/dna";
import { readFileSync } from "node:fs";
const b = JSON.parse(readFileSync("data/bands-now.json","utf8")).btc;
console.log(b.spot, dnaNow("btc","up",b.spot,b.spot-5), "|", dnaNow("btc","down",b.spot,b.spot+5));
