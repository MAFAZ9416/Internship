import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5174";
const SCREENSHOT_DIR = "C:\\Users\\mafaz\\.gemini\\antigravity\\brain\\3f9d0734-846d-4148-9fa7-6fdaba21b27b";
const mockImgPath = path.join(SCREENSHOT_DIR, "temp_upload_image.png");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
fs.writeFileSync(mockImgPath, "E2E Mobile Responsive Mock Image Data");

const devicesToTest = [
  { name: "iPhone_12_Pro", preset: devices["iPhone 12 Pro"] },
  { name: "iPhone_SE", preset: devices["iPhone SE"] },
  { name: "Samsung_S20_Ultra", preset: devices["Galaxy S20 Ultra"] },
  { name: "iPad_Air", preset: devices["iPad Air"] }
];

async function runMobileQA() {
  console.log("==================================================");
  console.log("STARTING MOBILE RESPONSIVENESS QA AUDIT");
  console.log("==================================================");

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const deviceObj of devicesToTest) {
    const { name, preset } = deviceObj;
    console.log(`\n--------------------------------------------------`);
    console.log(`AUDITING DEVICE: ${name} (${preset.viewport.width}x${preset.viewport.height})`);
    console.log(`--------------------------------------------------`);

    const context = await browser.newContext({
      ...preset
    });
    const page = await context.newPage();

    const consoleErrors = [];
    const networkFailures = [];
    let overflowDetected = false;

    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    page.on("requestfailed", (req) => {
      networkFailures.push(`${req.url()} (${req.failure()?.errorText})`);
    });

    async function wait(ms) {
      await page.waitForTimeout(ms);
    }

    async function takeScreenshot(stepName) {
      const fileName = `${name.toLowerCase()}_${stepName}.png`;
      const filePath = path.join(SCREENSHOT_DIR, fileName);
      await page.screenshot({ path: filePath });
      console.log(`Saved screenshot: ${filePath}`);
    }

    async function checkHorizontalScroll() {
      const hasScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      if (hasScroll) {
        console.warn(`[!] Horizontal scroll detected on ${name}!`);
        overflowDetected = true;
      }
      return hasScroll;
    }

    const uniqueId = Math.random().toString(36).substring(2, 10);
    const testUser = `mob_user_${uniqueId}`;
    const testEmail = `mob_${uniqueId}@example.com`;
    const testPassword = "Password123!";

    try {
      // 1. LOGIN & REGISTER TESTS
      console.log("[Register Page] Opening...");
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState("networkidle");
      await wait(1000);
      await checkHorizontalScroll();
      await takeScreenshot("1_register");

      // Fill & Submit Register
      await page.locator("input[placeholder='Enter your full name']").first().fill(testUser);
      await page.locator("input[placeholder='Enter your email']").first().fill(testEmail);
      await page.locator("input[placeholder='Create a password']").first().fill(testPassword);
      await page.locator("input[placeholder='Confirm your password']").first().fill(testPassword);
      
      const checkbox = page.locator("input[type='checkbox']").first();
      if (await checkbox.count() > 0) {
        await checkbox.check({ force: true });
      }
      
      await Promise.all([
        page.waitForURL("**/login", { timeout: 8000 }),
        page.locator("button[type='submit']").first().click()
      ]);
      console.log("[Register Page] Registered successfully.");

      console.log("[Login Page] Opening...");
      await page.waitForLoadState("networkidle");
      await wait(1000);
      await checkHorizontalScroll();
      await takeScreenshot("2_login");

      // Fill & Submit Login
      await page.locator("input[placeholder='Enter your email']").first().fill(testUser);
      await page.locator("input[placeholder='Enter your password']").first().fill(testPassword);
      
      await Promise.all([
        page.waitForURL("**/chat", { timeout: 8000 }),
        page.locator("button[type='submit']").first().click()
      ]);
      console.log("[Login Page] Logged in successfully.");

      // 2. CHAT PAGE TESTS
      console.log("[Chat Page] Validating mobile UI...");
      await page.waitForSelector("button svg[class*='bars'], button [class*='FaBars'], [class*='hamburger'], button:has-text('📝')", { timeout: 10000 });
      await wait(1000);
      await checkHorizontalScroll();
      await takeScreenshot("3_chat_pane");

      // Verify Mobile Sidebar overlay trigger
      const hamburger = page.locator("button svg[class*='bars'], button [class*='FaBars'], [class*='hamburger']").first();
      if (await hamburger.isVisible()) {
        console.log("[Sidebar] Opening mobile sidebar...");
        await hamburger.click();
        await wait(1000);
        await checkHorizontalScroll();
        await takeScreenshot("4_sidebar_open");
        
        // Close sidebar by clicking backdrop
        await page.mouse.click(320, 400);
        await wait(1000);
      }

      // 3. CHAT INPUT & MESSAGING
      console.log("[Messaging] Sending prompt...");
      const inputField = page.locator("input[placeholder='Message AI assistant...']").first();
      await inputField.fill("Short response test.");
      await page.locator("button[type='submit']").first().click();
      await page.waitForTimeout(4000); // Wait for response
      await checkHorizontalScroll();
      await takeScreenshot("5_messaging");

      // 4. FILE UPLOAD
      console.log("[File Upload] Uploading image...");
      const fileInput = page.locator("input[type='file']").first();
      await fileInput.setInputFiles(mockImgPath);
      await wait(1500);
      await takeScreenshot("6_file_preview");

      console.log("[File Upload] Sending image...");
      const textInput = page.locator("input[placeholder='Message AI assistant...']").first();
      await textInput.fill("Upload responsive check");
      await page.locator("button[type='submit']").first().click();
      await page.waitForTimeout(4000); // Wait for response
      await checkHorizontalScroll();
      await takeScreenshot("7_file_bubble");

      // 5. THEME TESTS (Light/Dark Mode)
      console.log("[Theme Test] Switching to Light Mode...");
      // Mobile Light mode switch: visit profile or click sun/moon if visible
      // Let's use localStorage toggle for guaranteed theme emulation
      await page.evaluate(() => {
        localStorage.setItem("theme", "light");
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      });
      await page.reload();
      await page.waitForTimeout(2000);
      await checkHorizontalScroll();
      await takeScreenshot("8_theme_light");

      console.log("[Theme Test] Switching back to Dark Mode...");
      await page.evaluate(() => {
        localStorage.setItem("theme", "dark");
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      });
      await page.reload();
      await page.waitForTimeout(2000);

      results.push({
        device: name,
        width: preset.viewport.width,
        height: preset.viewport.height,
        status: "PASS",
        overflowDetected,
        consoleErrorsCount: consoleErrors.length,
        networkFailuresCount: networkFailures.length
      });

    } catch (err) {
      console.error(`[✗] Device QA Failed: ${name}`, err);
      results.push({
        device: name,
        width: preset.viewport.width,
        height: preset.viewport.height,
        status: "FAIL",
        error: err.message,
        consoleErrorsCount: consoleErrors.length,
        networkFailuresCount: networkFailures.length
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  await browser.close();

  try {
    if (fs.existsSync(mockImgPath)) {
      fs.unlinkSync(mockImgPath);
    }
  } catch {}

  console.log("\n==================================================");
  console.log("MOBILE RESPONSIVENESS REPORT SUMMARY");
  console.log("==================================================");
  console.stringify = results;
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, "mobile_qa_results.json"),
    JSON.stringify(results, null, 2)
  );
}

runMobileQA();
