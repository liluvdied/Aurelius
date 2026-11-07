import { comboLessons } from "../src/lib/desk/combos";
const L = comboLessons();
console.log(JSON.stringify({ n: L.n, exits: L.exits, worst: L.worst, best: L.best, legPx: L.legPx, legMiss: L.legMiss }, null, 0));
