// Screenshot the running site at desktop and phone sizes (visual QA). Usage: node scripts/shots.mjs [baseUrl] [outDir]
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://localhost:3100";
const out = process.argv[3] ?? "shots";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`[${name}] ${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(20000); // let the 3D scene load and animate
  await page.screenshot({ path: `${out}/${name}-hero.png` });
  // Scroll through so reveal animations fire, then capture the full page.
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += viewport.height * 0.6) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(250); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
