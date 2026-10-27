// Screenshot one section by id at desktop and phone widths (WebGL off, like sections.mjs).
// Usage: node scripts/section.mjs <id> <out-prefix> [url]
import { chromium } from "playwright";

const [id = "pricing", out = "section", url = "http://localhost:3100/"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--disable-webgl", "--disable-3d-apis"] });
for (const [name, width] of [["desktop", 1440], ["phone", 375]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "networkidle" });
  const el = page.locator(`#${id}`);
  await el.scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const small = await page.evaluate((sel) => {
    const bad = [];
    for (const n of document.querySelectorAll(`${sel} *`)) {
      const fs = parseFloat(getComputedStyle(n).fontSize);
      if (n.childNodes.length && [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && fs < 13) bad.push(n.textContent.trim().slice(0, 30));
    }
    return bad;
  }, `#${id}`);
  await el.screenshot({ path: `${out}-${name}.png` });
  console.log(name, "overflow", overflow, "text<13px", small.length ? small : "none");
  await page.close();
}
await browser.close();
