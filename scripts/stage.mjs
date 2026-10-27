import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const [name, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto("http://localhost:3100", { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelector("canvas")?.closest("div.relative")?.scrollIntoView({ block: "center" }));
  await p.waitForTimeout(Number(process.argv[2] ?? 16000));
  await p.screenshot({ path: `shots/${name}-stage.png` });
  console.log(name, errs.length ? errs.join(" | ") : "no errors");
  await p.close();
}
await b.close();
