import { chromium } from "playwright";
const [w, h, prefix] = [Number(process.argv[2] ?? 1440), Number(process.argv[3] ?? 900), process.argv[4] ?? "d"];
const browser = await chromium.launch({ args: ["--disable-webgl", "--disable-3d-apis"] }); // tests the no-WebGL fallback too
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.emulateMedia({ reducedMotion: "reduce" }); // reveal animations off, so sections render fully
await page.goto("http://localhost:3100", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const boxes = await page.evaluate(() =>
  [...document.querySelectorAll("main > section, footer")].map((el) => {
    const r = el.getBoundingClientRect();
    return { x: 0, y: r.top + window.scrollY, width: document.documentElement.clientWidth, height: r.height };
  }),
);
for (let i = 1; i < boxes.length; i++) {
  await page.screenshot({ path: `shots/${prefix}-section-${i}.png`, fullPage: true, clip: boxes[i], timeout: 60000 });
}
await browser.close();
console.log(`${boxes.length - 1} parts`);
