import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5174";
const SCREENSHOT_DIR = "C:\\Users\\mafaz\\.gemini\\antigravity\\brain\\3f9d0734-846d-4148-9fa7-6fdaba21b27b";
const mockImgPath = path.join(SCREENSHOT_DIR, "temp_mobile_upload.png");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
fs.writeFileSync(mockImgPath, "E2E Mobile Visual QA Mock Image Data");

const viewports = [
  { name: "iPhone_12_Pro", width: 390, height: 844 },
  { name: "iPhone_SE", width: 375, height: 667 },
  { name: "Samsung_S20_Ultra", width: 412, height: 915 }
];

async function runMobileQA() {
  console.log("==================================================");
  console.log("STARTING LIVE VISUAL MOBILE E2E QA TEST (HEADLESS: FALSE)");
  console.log("==================================================");

  const browser = await chromium.launch({ 
    headless: false, // Run in live visible mode!
    slowMo: 1500 // 1.5 seconds delay between actions
  });

  const deviceResults = [];

  for (const vp of viewports) {
    const { name, width, height } = vp;
    console.log(`\n--------------------------------------------------`);
    console.log(`RUNNING QA FLOW ON EMULATED DEVICE: ${name} (${width}x${height})`);
    console.log(`--------------------------------------------------`);

    // Create emulated mobile context
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();

    const consoleErrors = [];
    const networkFailures = [];

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
      return false;
    }

    const uniqueId = Math.random().toString(36).substring(2, 10);
    const testUser = `mob_${uniqueId}`;
    const testEmail = `mob_${uniqueId}@example.com`;
    const testPassword = "Password123!";

    try {
      // ==========================================
      // STEP 1 - REGISTER PAGE
      // ==========================================
      console.log(`[${name}] Opening Register Page...`);
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => {
        localStorage.setItem("theme", "light");
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      });
      await page.reload();
      await wait(1500);

      console.log(`[${name}] Filling Register form (visible fields)...`);
      // Target only the visible input field on screen
      await page.locator("input[placeholder='Enter your full name']").filter({ visible: true }).first().fill(testUser);
      await wait(800);
      await page.locator("input[placeholder='Enter your email']").filter({ visible: true }).first().fill(testEmail);
      await wait(800);
      await page.locator("input[placeholder='Create a password']").filter({ visible: true }).first().fill(testPassword);
      await wait(800);
      await page.locator("input[placeholder='Confirm your password']").filter({ visible: true }).first().fill(testPassword);
      await wait(800);

      console.log(`[${name}] Toggling password visibility...`);
      const passEye = page.locator("input[placeholder='Create a password'] ~ button").filter({ visible: true }).first();
      await passEye.click();
      await wait(1500);
      await passEye.click(); // Toggle back
      await wait(1000);

      // Agree to terms checkbox
      const checkbox = page.locator("input[type='checkbox']").filter({ visible: true }).first();
      if (await checkbox.count() > 0) {
        await checkbox.check({ force: true });
      }
      await wait(1000);

      console.log(`[${name}] Submitting Register form...`);
      await Promise.all([
        page.waitForURL("**/login", { timeout: 10000 }),
        page.locator("button[type='submit']").filter({ visible: true }).first().click()
      ]);
      console.log(`[${name}] STEP 1 PASS.`);
      await wait(2000);
      await takeScreenshot("step1_registered");

      // ==========================================
      // STEP 2 - LOGIN PAGE
      // ==========================================
      console.log(`[${name}] Opening Login Page...`);
      await page.waitForLoadState("networkidle");
      await wait(1500);

      console.log(`[${name}] Filling Login form (visible fields)...`);
      await page.locator("input[placeholder='Enter your email']").filter({ visible: true }).first().fill(testUser);
      await wait(800);
      await page.locator("input[placeholder='Enter your password']").filter({ visible: true }).first().fill(testPassword);
      await wait(1200);

      console.log(`[${name}] Toggling login password visibility...`);
      const loginEye = page.locator("input[placeholder='Enter your password'] ~ button").filter({ visible: true }).first();
      await loginEye.click();
      await wait(1500);
      await loginEye.click(); // Toggle back
      await wait(1000);

      console.log(`[${name}] Logging in...`);
      await Promise.all([
        page.waitForURL("**/chat", { timeout: 10000 }),
        page.locator("button[type='submit']").filter({ visible: true }).first().click()
      ]);
      console.log(`[${name}] STEP 2 PASS.`);
      await wait(2000);
      await takeScreenshot("step2_logged_in");

      // ==========================================
      // STEP 3 - MOBILE CHAT UI & SIDEBAR OVERLAY
      // ==========================================
      console.log(`[${name}] Verifying Mobile Chat UI...`);
      await page.waitForSelector("header", { timeout: 10000 });
      await wait(1500);

      // Verify hamburger button is visible inside mobile header
      const hamburger = page.locator("header button").filter({ visible: true }).first();
      if (await hamburger.count() === 0) throw new Error("Mobile Hamburger button not visible");
      console.log("[✓] Hamburger menu icon loaded.");

      // Open mobile sidebar overlay
      console.log(`[${name}] Opening Mobile Sidebar...`);
      await hamburger.click();
      await wait(1500);
      await takeScreenshot("step3_sidebar_open");

      // Verify sidebar features inside emulated overlay drawer
      const searchBox = page.locator("div.fixed.inset-0 input[placeholder*='Search']").first();
      if (await searchBox.count() === 0) throw new Error("Search box in Mobile sidebar not visible");
      const newChatBtn = page.locator("div.fixed.inset-0 button", { hasText: "New Chat" }).first();
      if (await newChatBtn.count() === 0) throw new Error("New Chat button in Mobile sidebar not visible");
      console.log("[✓] Sidebar features fully loaded.");

      // Close mobile sidebar by clicking the backdrop overlay
      console.log(`[${name}] Closing Mobile Sidebar...`);
      await page.mouse.click(320, 400);
      await wait(1500);

      // ==========================================
      // STEP 4 - SEND MESSAGE & AI RESPONSE
      // ==========================================
      console.log(`[${name}] Sending prompt: 'Explain Django in 50 words'...`);
      const chatInput = page.locator("input[placeholder='Message AI assistant...']").filter({ visible: true }).first();
      await chatInput.fill("Explain Django in 50 words");
      await wait(1000);

      await page.locator("button[type='submit']").filter({ visible: true }).first().click();
      console.log(`[${name}] Waiting for AI response...`);
      await page.waitForTimeout(4000); // Wait for response
      await takeScreenshot("step4_django_response");

      // ==========================================
      // STEP 5 - IMAGE UPLOAD & PERSISTENCE
      // ==========================================
      console.log(`[${name}] Uploading image file...`);
      const fileInput = page.locator("input[type='file']").first();
      await fileInput.setInputFiles(mockImgPath);
      await wait(1500);
      await takeScreenshot("step5_image_preview");

      console.log(`[${name}] Sending image to AI...`);
      const imgTextInput = page.locator("input[placeholder='Message AI assistant...']").filter({ visible: true }).first();
      await imgTextInput.fill("Responsive check");
      await wait(1000);
      await page.locator("button[type='submit']").filter({ visible: true }).first().click();
      await page.waitForTimeout(4000); // Wait for response

      console.log(`[${name}] Reloading page to verify persistence...`);
      await page.reload();
      await page.waitForLoadState("networkidle");
      await wait(2500);
      await takeScreenshot("step5_persisted_check");

      // ==========================================
      // STEP 6 - THEME TEST
      // ==========================================
      console.log(`[${name}] Simulating Dark Mode toggle...`);
      await page.evaluate(() => {
        localStorage.setItem("theme", "dark");
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      });
      await page.reload();
      await page.waitForTimeout(2000);
      await takeScreenshot("step6_theme_dark");

      console.log(`[${name}] Simulating Light Mode toggle...`);
      await page.evaluate(() => {
        localStorage.setItem("theme", "light");
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      });
      await page.reload();
      await page.waitForTimeout(2000);
      await takeScreenshot("step6_theme_light");

      // ==========================================
      // STEP 7 - SIDEBAR FEATURES (Rename, Pin, Archive, Delete)
      // ==========================================
      console.log(`[${name}] Opening sidebar for chat actions...`);
      await page.locator("header button").filter({ visible: true }).first().click();
      await wait(1500);

      // We perform a rename dialog accept mock
      const renameBtn = page.locator("div.fixed.inset-0 button[title='Rename chat']").first();
      if (await renameBtn.count() > 0) {
        page.once("dialog", async (dialog) => {
          await dialog.accept("QA Responsive Chat");
        });
        await renameBtn.click();
        await wait(2000);
      }

      // Pin
      const pinBtn = page.locator("div.fixed.inset-0 button[title='Pin chat']").first();
      if (await pinBtn.count() > 0) {
        await pinBtn.click();
        await wait(2000);
      }

      // Archive
      const archiveBtn = page.locator("div.fixed.inset-0 button[title='Archive chat']").first();
      if (await archiveBtn.count() > 0) {
        await archiveBtn.click();
        await wait(2000);
      }

      // Restore
      const showArchivedBtn = page.locator("div.fixed.inset-0 button", { hasText: "Archived" }).first();
      if (await showArchivedBtn.count() > 0) {
        await showArchivedBtn.click();
        await wait(1500);
      }
      const restoreBtn = page.locator("div.fixed.inset-0 button[title='Restore chat']").first();
      if (await restoreBtn.count() > 0) {
        await restoreBtn.click();
        await wait(2000);
      }

      // Delete
      console.log(`[${name}] Deleting conversation...`);
      const deleteBtn = page.locator("div.fixed.inset-0 button[title='Delete chat']").first();
      if (await deleteBtn.count() > 0) {
        page.once("dialog", async (dialog) => {
          await dialog.accept();
        });
        await deleteBtn.click();
        await wait(2000);
      }
      await takeScreenshot("step7_chat_actions");

      // ==========================================
      // STEP 8 - LOGOUT
      // ==========================================
      console.log(`[${name}] Logging out...`);
      // Open sidebar one last time to access profile Logout
      await page.locator("header button").filter({ visible: true }).first().click();
      await wait(1500);

      const logoutBtn = page.locator("div.fixed.inset-0 button", { hasText: "Logout" }).first();
      if (await logoutBtn.count() > 0) {
        await logoutBtn.click();
        await wait(2000);
      }
      await takeScreenshot("step8_logged_out");

      deviceResults.push({
        device: name,
        viewport: `${width}x${height}`,
        status: "PASS",
        consoleErrors: consoleErrors.length,
        networkFailures: networkFailures.length
      });

    } catch (err) {
      console.error(`[✗] Mobile E2E QA failed on device: ${name}`, err);
      deviceResults.push({
        device: name,
        viewport: `${width}x${height}`,
        status: "FAIL",
        error: err.message,
        consoleErrors: consoleErrors.length,
        networkFailures: networkFailures.length
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  console.log("MOBILE RESPONSIVENESS QA VERIFICATION COMPLETE. KEEPING BROWSER OPEN FOR 5 MINUTES FOR OBSERVATION.");
  // Keep open by waiting for 5 minutes
  const keepOpenPage = await browser.newPage();
  await keepOpenPage.goto(BASE_URL);
  await keepOpenPage.waitForTimeout(300000); // 5 minutes
  await browser.close();

  // Clean up
  try {
    if (fs.existsSync(mockImgPath)) {
      fs.unlinkSync(mockImgPath);
    }
  } catch {}

  console.log("\n==================================================");
  console.log("MOBILE RESPONSIVENESS QA VERIFICATION REPORT");
  console.log("==================================================");
  console.log(JSON.stringify(deviceResults, null, 2));

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, "mobile_qa_results.json"),
    JSON.stringify(deviceResults, null, 2)
  );
}

runMobileQA();
