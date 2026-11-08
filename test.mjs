import puppeteer from "puppeteer";
import http from "http";
import { readFileSync } from "fs";

const html = readFileSync("dist/index.html");
const server = http.createServer((_, res) => { res.setHeader("Content-Type", "text/html"); res.end(html); });
await new Promise((r) => server.listen(4173, r));

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });

const shot = (name) => page.screenshot({ path: `src/assets/raw/test-${name}.png` });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = async (text, extra = "") => {
  const ok = await page.evaluate((t, ex) => {
    const btns = [...document.querySelectorAll("button, a")];
    const b = btns.find((x) => x.textContent.replace(/\s+/g, " ").includes(t) && (!ex || x.getAttribute("aria-pressed") !== null));
    if (b) { b.click(); return true; }
    return false;
  }, text, extra);
  console.log(`${ok ? "PASS" : "FAIL"} click "${text}"`);
  return ok;
};

await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:4173", { waitUntil: "networkidle0", timeout: 30000 });
await page.waitForFunction(() => !document.body.innerText.includes("Chilling the cans"), { timeout: 15000 });
await sleep(2400);
console.log("PASS loader gone + entrance");
await shot("01-initial");

// flavor switch via card
await clickText("Zero Lime", "card");
await sleep(2200);
await shot("02-lime");
const bgBlue = await page.evaluate(() => document.body.innerText.includes("Nº 02"));
console.log(bgBlue ? "PASS switched to lime" : "FAIL lime switch");

// keyboard switch back
await page.keyboard.press("ArrowLeft");
await sleep(2200);
const bgGreen = await page.evaluate(() => document.body.innerText.includes("Nº 01"));
console.log(bgGreen ? "PASS keyboard switch back" : "FAIL keyboard switch");

// drag the can + wheel zoom + poke
await page.mouse.move(720, 450);
await page.mouse.down();
await page.mouse.move(880, 450, { steps: 8 });
await page.mouse.up();
await page.mouse.wheel({ deltaY: -240 });
await sleep(600);
await page.mouse.click(720, 450);
await sleep(400);
console.log("PASS drag/zoom/poke no crash");

// rapid repeated switching stability
for (let i = 0; i < 4; i++) { await page.keyboard.press("ArrowRight"); await sleep(i === 0 ? 2000 : 300); }
await sleep(2200);
console.log("PASS rapid switching");

// ingredients panel
await clickText("Ingredients");
await sleep(800);
await shot("03-ingredients");
await page.keyboard.press("Escape");
await sleep(600);

// taste panel
await clickText("Taste");
await sleep(900);
await page.keyboard.press("Escape");
await sleep(500);

// reviews: open, write a review
await clickText("Reviews");
await sleep(700);
await clickText("Write");
await sleep(400);
await page.type('input[placeholder="Your name"]', "Test Sipper");
await page.evaluate(() => { [...document.querySelectorAll('button[aria-label="5 stars"]')].pop()?.click(); });
await page.type('textarea[placeholder="How did it fizz?"]', "Absolutely electric fizz, ten out of ten.");
await clickText("Publish review");
await sleep(600);
const reviewAdded = await page.evaluate(() => document.body.innerText.includes("Test Sipper"));
console.log(reviewAdded ? "PASS review published" : "FAIL review publish");
await shot("04-reviews");
await page.keyboard.press("Escape");
await sleep(500);

// shop flow
await clickText("Shop Now");
await sleep(800);
await shot("05-shop");
await clickText("6-pack · $15.99");
await sleep(200);
const addClicked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")].filter((b) => b.textContent.trim() === "Add" || b.textContent.trim().startsWith("Add"));
  const b = btns.find((x) => x.closest("[data-sheet]"));
  if (b) { b.click(); return true; } return false;
});
console.log(addClicked ? "PASS add to cart" : "FAIL add to cart");
await sleep(600);
await clickText("Cart ·");
await sleep(600);
await shot("06-cart");
await clickText("Checkout");
await sleep(2200);
const orderDone = await page.evaluate(() => document.body.innerText.includes("confirmed"));
console.log(orderDone ? "PASS checkout complete" : "FAIL checkout");
await shot("07-order-done");
await page.keyboard.press("Escape");
await sleep(600);

// quick add + undo remove
await page.evaluate(() => { document.querySelector('button[aria-label^="Add one"]')?.click(); });
await sleep(500);
await page.evaluate(() => { [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Open cart, 1 item")?.click(); });
await sleep(600);
await page.evaluate(() => { document.querySelector('button[aria-label^="Remove"]')?.click(); });
await sleep(400);
const undoVisible = await page.evaluate(() => document.body.innerText.includes("Undo"));
console.log(undoVisible ? "PASS remove + undo toast" : "FAIL undo toast");
await clickText("Undo");
await sleep(400);
const restored = await page.evaluate(() => document.body.innerText.includes("Diet Classic") && document.body.innerText.includes("Subtotal"));
console.log(restored ? "PASS undo restored item" : "FAIL undo restore");
await page.keyboard.press("Escape");
await sleep(500);

// mobile viewport
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await sleep(1200);
await shot("08-mobile");
await page.evaluate(() => { [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-pressed") !== null && b.textContent.includes("Zero Lime"))?.click(); });
await sleep(2200);
await shot("09-mobile-lime");
await clickText("Shop Now · from");
await sleep(900);
await shot("10-mobile-shop");
await page.keyboard.press("Escape");

console.log("ERRORS:", errors.length ? errors.slice(0, 10) : "none");
await browser.close();
server.close();
