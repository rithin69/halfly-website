// Render the guide HTML to an A4 PDF with page numbers. Usage: node render.mjs <in.html> <out.pdf>
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";

const [input, output] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(input).href, { waitUntil: "load" });
await page.pdf({
  path: output,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="width:100%;font-size:8px;color:#8a6a7e;padding:0 17mm;display:flex;justify-content:space-between;font-family:Segoe UI,sans-serif">' +
    '<span>Halfly, explained</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
});
await browser.close();
console.log("wrote", output);
