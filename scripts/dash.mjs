// Screenshot the Halfly proxy dashboard (served by `halfly serve`) at desktop and phone widths.
// Usage: node scripts/dash.mjs <url> <out-prefix>
import { chromium } from "playwright";

const [url = "http://127.0.0.1:8765/dashboard", out = "dash"] = process.argv.slice(2);
const browser = await chromium.launch();
for (const [name, width, height] of [["desktop", 1280, 1100], ["phone", 375, 2200]]) {
  for (const scheme of ["light", "dark"]) {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: scheme });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.getElementById("status").textContent.startsWith("Updated"), null, { timeout: 15000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `${out}-${name}-${scheme}.png`, fullPage: true });
    console.log(name, scheme, "overflow", overflow, "errors", errors.length ? errors : "none");
    await page.close();
  }
}
await browser.close();
