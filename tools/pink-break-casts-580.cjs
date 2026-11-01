// fix580 proof: the pink's BREAK candidate (bonesDecide) casts at HER $5 (btc) / 25c (gold), not the $6/33c band break;
// session bands cast at her $5 too (Love Nov 1: "$5 past the pink or session"). Extracts bonesDecide from recon.ts and replays a clean break.
const fs=require("fs"),path=require("path");
const root=__dirname+"/..";
const ts=require(path.join(root,"node_modules/typescript"));
const src=fs.readFileSync(process.argv[2]||path.join(root,"src/lib/desk/recon.ts"),"utf8");
function matchFrom(j){let depth=0;for(let k=j;k<src.length;k++){if(src[k]==="{")depth++;else if(src[k]==="}"){depth--;if(depth===0)return src.slice(bodyI,k+1);}}}
function grab(head){const i=src.indexOf(head);if(i<0)throw new Error("missing "+head);bodyI=i;let j;if(head==="export function bonesDecide("){const anchor=src.indexOf("const brk = BREAK[asset]",i);j=src.lastIndexOf("{",anchor);}else if(/function/.test(head)){const m=/\)\s*:\s*[^\{]*\{/.exec(src.slice(i));j=i+m.index+m[0].length-1;}else j=src.indexOf("{",src.indexOf("=",i));return matchFrom(j);}
let bodyI=0;
const parts=[
 "type Line={name:string;price:number;unit?:number};","type Bar={t:number;o:number;h:number;l:number;c:number};","type Piv={pp:number;r1:number;s1:number;r2:number;s2:number;a:number};",
 grab("const BREAK:"),grab("const TAP:"),grab("const REACH:"),grab("const REACH_PCT ="),
 // stubs for flip helpers (breaks don't use them)
 "function anyFlip406Now(a,s,sp,x){return false;} function anyFlipNow(a,s,sp){return false;} function pfFlipOk(a,s,sp){return false;} function anyGreen521(){return false;} function anyRed521(){return false;} function turnFlip530(){return false;}",
 grab("export function bonesDecide("),
].map(x=>x.replace(/^export /,""));
const js=ts.transpileModule(parts.join("\n"),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const bones=new Function(js+"; return bonesDecide;")();
// board: pink (5m PP) at 100000, a session band +1σ at 100100. 5m candle opened at 99990 (below both). No bars (no 1m close cross) so only the live-push break (178/179) can fire.
function brk(line,tick){
  const L=[{name:"5m PP",price:100000},{name:"+1σ",price:103000},{name:"-1σ",price:97000}];
  const cur={o:99990,h:tick,l:99990}; // opened below pink, high=tick; session bands far so spot is mid-channel (survives thirds)
  return bones("btc",L,tick,undefined,cur,null,[],false,0,false,false,false);
}
function up(tick){const r=brk(null,tick);return r&&r.side==="up"?r.label:null;}
let ok=true;
const fail=(m)=>{ok=false;console.log("PINK-BREAK-CASTS: FAIL - "+m);};
// PINK: must cast the break at $5 (100005), and NOT yet at $4 (100004)
const p4=up(100004), p5=up(100005);
console.log("  pink break @ $4 (100004): "+(p4||"none")+"   @ $5 (100005): "+(p5||"none"));
if(p4&&/5m PP/.test(p4)) fail("the pink break cast at only $4 (should wait for her $5)");
if(!(p5&&/Break above 5m PP/.test(p5))) fail("the pink break did NOT cast at her $5 (still waiting past $5) -> "+(p5||"none"));
// SESSION band +1σ: her $5 - must NOT cast at $4, must cast at $5
// move pink far away so only +1σ is the break candidate near tick
function brkB(tick){const L=[{name:"5m PP",price:90000},{name:"+1σ",price:100100},{name:"+2σ",price:103000},{name:"-1σ",price:97000}];const cur={o:100090,h:tick,l:100090};return bones("btc",L,tick,undefined,cur,null,[],false,0,false,false,false);}
const b5=brkB(100104), b6=brkB(100105);
const bl5=b5&&b5.side==="up"?b5.label:null, bl6=b6&&b6.side==="up"?b6.label:null;
console.log("  +1σ break @ $4 (100104): "+(bl5||"none")+"   @ $5 (100105): "+(bl6||"none"));
if(bl5&&/\+1σ/.test(bl5)) fail("the SESSION +1σ break cast at only $4 (should wait for her $5)");
if(!(bl6&&/Break above \+1σ/.test(bl6))) fail("the session +1σ break did NOT cast at her $5 (still waiting past $5) -> "+(bl6||"none"));
console.log(ok?"PINK-BREAK-CASTS ✓ - the pink break and the session band break both cast at her $5 (not $4, not $6) (fix580).":"PINK-BREAK-CASTS: FAIL");
process.exit(ok?0:1);
