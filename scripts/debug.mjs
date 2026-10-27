import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto("http://localhost:3100", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const r = await page.evaluate((w) => {
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const b = el.getBoundingClientRect();
      if (b.right > w + 1 && b.width > 0) out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(b.right)} w=${Math.round(b.width)}`);
    }
    const tags = [...document.querySelectorAll("span")].filter((s) => /^(cheap model|strong model|cache|trained router)$/.test(s.textContent.trim()))
      .map((s) => { const b = s.getBoundingClientRect(); const st = getComputedStyle(s.parentElement); return `${s.textContent}: x=${Math.round(b.x)} y=${Math.round(b.y)} w=${Math.round(b.width)} vis=${st.visibility} disp=${st.display} op=${st.opacity}`; });
    return { scrollW: document.documentElement.scrollWidth, overflow: out.slice(0, 12), tags };
  }, vp.width);
  console.log(`== ${vp.width}px  scrollWidth=${r.scrollW}`); console.log(r.overflow.join("\n")); console.log(r.tags.join("\n"));
  await page.close();
}
await browser.close();
