// fix434 behaviour test (Love Oct 28 2026 5:56 PM PT: "she needs to be ON the side of the break" + 8:39 PM "and the 33% ????"): STAGED, not installed.
const fs=require("fs"),path=require("path");const root=process.env.AUR_ROOT||path.join(__dirname,"..");const ts=require(path.join(root,"node_modules/typescript"));
const src=fs.readFileSync(process.argv[2]||path.join(root,"src/lib/desk/bandlock.ts"),"utf8");
function grab(h){const i=src.indexOf(h);if(i<0){console.log("SIDE TEST: FAIL - missing "+h);process.exit(1)}let j;if(/function/.test(h)){const m=/\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i));j=i+m.index+m[0].length-1}else j=src.indexOf("{",src.indexOf("=",i));let d=0;for(let k=j;k<src.length;k++){if(src[k]==="{")d++;else if(src[k]==="}"){d--;if(d===0)return /function/.test(h)?src.slice(i,k+1):src.slice(i,src.indexOf(";",k)+1)}}}
const js=ts.transpileModule(["type Line = { name: string; price: number };",grab("export const BREAK_DIST"),grab("export function sameSide434("),"function fiveOpenNow(a){return 0}"].map(x=>x.replace(/^export /,"")).join("\n"),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const S=new Function(js+";return sameSide434;")();let ok=true;const t=(c,m)=>{if(!c){ok=false;console.log("SIDE TEST: FAIL - "+m)}};
const G=[{name:"-1.5σ",price:4039.80},{name:"-1σ",price:4043.85},{name:"-0.5σ",price:4047.90},{name:"5m PP",price:4047.32}];
t(S("gold",G,4044.03,"up",4042.27),"7:40 PM gold long, 18c over -1σ (came up through it, not by 33c) - must be refused (top 33% of -1.5σ -> -1σ)");
t(S("gold",G,4043.63,"up",4042.27),"7:40 PM gold long at 4043.63 under -1σ - must be refused");
t(S("gold",G,4043.70,"up",4042.27),"broke -1σ then fell back to 4043.70 - must be refused");
t(!S("gold",G,4045.40,"up",4042.27),"long $1.55 through -1σ (on her side), 37% of -1σ -> -0.5σ - must pass");
t(!S("gold",G,4041.50,"up",4040.00),"long at 42% of -1.5σ -> -1σ - must pass");
t(!S("gold",G,4044.03,"up",4045.00),"bounce long off -1σ from above (candle opened over it) - must pass");
t(S("gold",G,4040.50,"down",4041.00),"short in the bottom 33% of -1.5σ -> -1σ - must be refused");
const B=[{name:"-2σ",price:79551.54},{name:"-1σ",price:80152.01}];
t(S("btc",B,80120,"up",80000),"BTC long at 95% under -1σ - must be refused");
t(!S("btc",B,79844.01,"up",79819.14),"8:16 PM BTC long at 49% of -2σ -> -1σ - the 33% does not apply there (the pink rules catch it)");
console.log(ok?"SIDE TEST ✓ - her 33% runs session band to session band and a band counts passed only when price is NOW her break distance through it (or bouncing off it): pokes and fall-backs are refused, clean trades pass.":"SIDE TEST: FAIL");process.exit(ok?0:1);
