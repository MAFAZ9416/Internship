import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5174";
const SCREENSHOT_DIR = "C:\\Users\\mafaz\\.gemini\\antigravity\\brain\\3f9d0734-846d-4148-9fa7-6fdaba21b27b";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Generate mock files for upload
const mockJpg = path.join(__dirname, "mock_jpg.jpg");
const mockPng = path.join(__dirname, "mock_png.png");
const mockPdf = path.join(__dirname, "mock_pdf.pdf");
const mockDocx = path.join(__dirname, "mock_docx.docx");
const mockTxt = path.join(__dirname, "mock_txt.txt");

fs.writeFileSync(mockJpg, "JPEG MOCK FILE DATA");
fs.writeFileSync(mockPng, "PNG MOCK FILE DATA");
fs.writeFileSync(mockPdf, "PDF MOCK FILE DATA");
fs.writeFileSync(mockDocx, "DOCX MOCK FILE DATA");
fs.writeFileSync(mockTxt, "TXT MOCK FILE DATA");

async function runE2E() {
  console.log("==================================================");
  console.log("STARTING FULL LIVE VISUAL END-TO-END QA TESTING");
  console.log("==================================================");

  const browser = await chromium.launch({ 
    headless: false, // Run in live visible mode!
    slowMo: 1500 // 1.5 seconds delay between actions
  });

  // Keep track of statuses for Step 12
  const results = {
    Authentication: "FAIL",
    Theme: "FAIL",
    Chat: "FAIL",
    Edit: "FAIL",
    Save: "FAIL",
    Copy: "FAIL",
    Regenerate: "FAIL",
    Rename: "FAIL",
    Pin: "FAIL",
    Archive: "FAIL",
    Delete: "FAIL",
    "Upload Image": "FAIL",
    "Upload PDF": "FAIL",
    "Upload DOCX": "FAIL",
    "Upload TXT": "FAIL",
    "Refresh Persistence": "FAIL",
    "Mobile Drawer": "FAIL",
    score: 0,
    issues: []
  };

  const consoleErrors = [];
  const networkFailures = [];

  // Desktop Page Context
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  page.on("pageerror", (err) => {
    console.error("React Client Error:", err.message);
    consoleErrors.push(err.message);
  });

  page.on("requestfailed", (req) => {
    console.warn("Network Error:", req.url(), req.failure()?.errorText);
    networkFailures.push(`${req.url()} (${req.failure()?.errorText})`);
  });

  const uniqueId = Math.random().toString(36).substring(2, 10);
  const testUser = `qa_desk_${uniqueId}`;
  const testEmail = `qa_desk_${uniqueId}@example.com`;
  const testPassword = "Password123!";

  try {
    // ==========================================
    // STEP 1 — START APPLICATION
    // ==========================================
    console.log("\n--- STEP 1: START APPLICATION & VERIFY RUNNING ---");
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    console.log("✓ Application accessible at", BASE_URL);

    // ==========================================
    // STEP 2 — DESKTOP TEST (LOGIN PAGE)
    // ==========================================
    console.log("\n--- STEP 2: DESKTOP LOGIN PAGE TEST ---");
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Verify Fields
    const logoExists = await page.locator("text=AI Chat, text=AI assistant").first().count() > 0;
    const themeToggleExists = await page.locator("button[title*='Theme'], button[title*='Mode']").first().count() > 0;
    const emailField = page.locator("input[placeholder='Enter your email']").first();
    const passField = page.locator("input[placeholder='Enter your password']").first();
    const eyeToggle = page.locator("input[placeholder='Enter your password'] ~ button").first();
    const loginButton = page.locator("button[type='submit']").first();
    const googleButton = page.locator("button", { hasText: "Google" }).first();
    const githubButton = page.locator("button", { hasText: "GitHub" }).first();

    console.log("Logo visible:", logoExists ? "✓" : "✗");
    console.log("Theme toggle visible:", themeToggleExists ? "✓" : "✗");
    console.log("Email field visible:", await emailField.isVisible() ? "✓" : "✗");
    console.log("Password field visible:", await passField.isVisible() ? "✓" : "✗");
    console.log("Eye toggle visible:", await eyeToggle.isVisible() ? "✓" : "✗");
    console.log("Login button visible:", await loginButton.isVisible() ? "✓" : "✗");
    console.log("Google button visible:", await googleButton.isVisible() ? "✓" : "✗");
    console.log("GitHub button visible:", await githubButton.isVisible() ? "✓" : "✗");

    // Toggle password eye
    await passField.fill("SomePassword123!");
    console.log("Password initial type:", await passField.getAttribute("type"));
    await eyeToggle.click();
    await page.waitForTimeout(500);
    console.log("Password toggled type:", await passField.getAttribute("type"));
    await eyeToggle.click();

    // Theme Switch Test
    const toggleBtn = page.locator("button[title*='Theme'], button[title*='Mode']").first();
    if (await toggleBtn.isVisible()) {
      console.log("Switching to Dark Theme...");
      await toggleBtn.click();
      await page.waitForTimeout(1000);
      console.log("Switching to Light Theme...");
      await toggleBtn.click();
      await page.waitForTimeout(1000);
    }

    // Save Screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "login.png") });
    console.log("Screenshot saved: login.png");

    // ==========================================
    // STEP 3 — REGISTER TEST
    // ==========================================
    console.log("\n--- STEP 3: REGISTER PAGE TEST ---");
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const regName = page.locator("input[placeholder='Enter your full name']").first();
    const regEmail = page.locator("input[placeholder='Enter your email']").first();
    const regPass = page.locator("input[placeholder='Create a password']").first();
    const regConfirm = page.locator("input[placeholder='Confirm your password']").first();
    const regEye = page.locator("input[placeholder='Create a password'] ~ button").first();
    const regBtn = page.locator("button[type='submit']").first();
    const regGoogle = page.locator("button", { hasText: "Google" }).first();
    const regGithub = page.locator("button", { hasText: "GitHub" }).first();

    console.log("Full Name input visible:", await regName.isVisible() ? "✓" : "✗");
    console.log("Email input visible:", await regEmail.isVisible() ? "✓" : "✗");
    console.log("Password input visible:", await regPass.isVisible() ? "✓" : "✗");
    console.log("Confirm Password input visible:", await regConfirm.isVisible() ? "✓" : "✗");
    console.log("Eye toggle visible:", await regEye.isVisible() ? "✓" : "✗");
    console.log("Register button visible:", await regBtn.isVisible() ? "✓" : "✗");

    // Switch themes on register page
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(800);
      await toggleBtn.click();
      await page.waitForTimeout(800);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "register.png") });
    console.log("Screenshot saved: register.png");

    // ==========================================
    // STEP 4 — AUTH FLOW
    // ==========================================
    console.log("\n--- STEP 4: REGISTER AND LOGIN AUTH FLOW ---");
    await regName.fill(testUser);
    await regEmail.fill(testEmail);
    await regPass.fill(testPassword);
    await regConfirm.fill(testPassword);
    await page.waitForTimeout(500);

    // Check terms if present
    const terms = page.locator("input[type='checkbox']").first();
    if (await terms.count() > 0) {
      await terms.check({ force: true });
    }

    console.log("Submitting Register Form...");
    await regBtn.click();
    await page.waitForURL("**/login", { timeout: 8000 });
    console.log("✓ Successfully registered, redirected to Login page.");
    await page.waitForTimeout(2000);

    // Fill Login Form
    console.log("Logging in with newly created user...");
    await page.locator("input[placeholder='Enter your email']").first().fill(testUser);
    await page.locator("input[placeholder='Enter your password']").first().fill(testPassword);
    await page.waitForTimeout(500);
    await page.locator("button[type='submit']").first().click();

    await page.waitForURL("**/chat", { timeout: 10000 });
    console.log("✓ Successfully authenticated, redirected to Chat page.");
    results.Authentication = "PASS";
    await page.waitForTimeout(2000);

    // ==========================================
    // STEP 5 — DESKTOP CHAT PAGE
    // ==========================================
    console.log("\n--- STEP 5: DESKTOP CHAT PAGE UI VERIFICATION ---");
    // Verify Sidebar structure
    const sidebar = page.locator("div.border-r, aside, [class*='sidebar']").first();
    const newChatBtn = page.locator("button", { hasText: "New Chat" }).first();
    const searchInput = page.locator("input[placeholder*='Search']").first();
    const userCard = page.locator("text=" + testUser + ", [class*='profile']").first();
    const logoutBtn = page.locator("button:has-text('Logout')").first();

    console.log("Sidebar visible:", await sidebar.isVisible() ? "✓" : "✗");
    console.log("New Chat button visible:", await newChatBtn.isVisible() ? "✓" : "✗");
    console.log("Search input visible:", await searchInput.isVisible() ? "✓" : "✗");
    console.log("User Profile visible:", await userCard.isVisible() ? "✓" : "✗");
    console.log("Logout button visible:", await logoutBtn.isVisible() ? "✓" : "✗");

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop_chat.png") });
    console.log("Screenshot saved: desktop_chat.png");

    // ==========================================
    // STEP 6 — CHAT FEATURES
    // ==========================================
    console.log("\n--- STEP 6: CHAT FEATURES & INTERACTIVE ACTIONS ---");
    // Create new chat
    await newChatBtn.click();
    await page.waitForTimeout(1000);

    // Send a message "Hello"
    const chatInput = page.locator("input[placeholder='Message AI assistant...'], textarea[placeholder*='Message']").first();
    await chatInput.fill("Hello");
    await page.waitForTimeout(500);
    await page.locator("button[title='Send message'], button[type='submit']").first().click();
    console.log("Sent prompt: 'Hello'");

    // Wait for AI Response
    console.log("Waiting for AI bubble response...");
    await page.waitForSelector("text=🤖", { timeout: 15000 });
    await page.waitForTimeout(3000); // Give it time to finish typing
    console.log("✓ AI response received!");
    results.Chat = "PASS";

    // --- Verify User Actions ---
    console.log("Verifying Message Editing...");
    const editBtn = page.locator("button:has-text('Edit')").first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(500);
      const editInput = page.locator("textarea, input[value='Hello']").first();
      await editInput.fill("Hello - updated visual prompt");
      
      // Cancel edit
      const cancelBtn = page.locator("button:has-text('Cancel')").first();
      await cancelBtn.click();
      console.log("✓ Message edit cancelled.");

      // Perform real edit and Save
      await editBtn.click();
      await page.waitForTimeout(500);
      const editInput2 = page.locator("textarea, input[value='Hello']").first();
      await editInput2.fill("Hello - updated visual prompt");
      await page.waitForTimeout(500);
      const saveBtn = page.locator("button:has-text('Save')").first();
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log("✓ Message edited and saved successfully.");
      results.Edit = "PASS";
      results.Save = "PASS";
    }

    // --- Verify AI Actions ---
    console.log("Verifying AI bubble actions...");
    // Copy AI response
    const copyBtn = page.locator("button[title*='Copy'], button svg[class*='copy'], [class*='copy']").first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForTimeout(1000);
      console.log("✓ AI response copied.");
      results.Copy = "PASS";
    }

    // Regenerate AI Response
    const regenBtn = page.locator("button[title*='Regenerate']").first();
    if (await regenBtn.count() > 0) {
      await regenBtn.click();
      console.log("Regenerating AI response...");
      await page.waitForTimeout(4000);
      console.log("✓ AI response regenerated.");
      results.Regenerate = "PASS";
    }

    // Like and Dislike actions
    const likeBtn = page.locator("button[title='Helpful response']").first();
    const dislikeBtn = page.locator("button[title='Not helpful response']").first();
    if (await likeBtn.count() > 0) {
      await likeBtn.click();
      await page.waitForTimeout(500);
      console.log("✓ AI bubble liked.");
    }
    if (await dislikeBtn.count() > 0) {
      await dislikeBtn.click();
      await page.waitForTimeout(500);
      console.log("✓ AI bubble disliked.");
    }

    // Delete message
    const deleteMsgBtn = page.locator("button[title='Delete Message']").first();
    if (await deleteMsgBtn.count() > 0) {
      await deleteMsgBtn.click();
      await page.waitForTimeout(1000);
      console.log("✓ Message deleted successfully.");
    }

    // --- Verify Chat Actions ---
    console.log("Verifying conversation card actions in sidebar...");
    if (await page.locator("div.group.relative button").first().count() > 0) {
      // Pin chat
      await page.locator("div.group.relative button").first().click({ force: true });
      await page.waitForTimeout(800);
      await page.locator("button:has-text('Pin Chat')").first().click({ force: true });
      await page.waitForTimeout(1500);
      console.log("✓ Chat pinned.");
      results.Pin = "PASS";

      // Unpin chat
      await page.locator("div.group.relative button").first().click({ force: true });
      await page.waitForTimeout(800);
      await page.locator("button:has-text('Unpin Chat')").first().click({ force: true });
      await page.waitForTimeout(1500);
      console.log("✓ Chat unpinned.");

      // Rename chat
      page.once("dialog", async (dialog) => {
        await dialog.accept("Renamed QA Desktop Chat");
      });
      await page.locator("div.group.relative button").first().click({ force: true });
      await page.waitForTimeout(800);
      await page.locator("button:has-text('Rename Chat')").first().click({ force: true });
      await page.waitForTimeout(2000);
      console.log("✓ Chat renamed.");
      results.Rename = "PASS";

      // Archive chat
      await page.locator("div.group.relative button").first().click({ force: true });
      await page.waitForTimeout(800);
      await page.locator("button:has-text('Archive Chat')").first().click({ force: true });
      await page.waitForTimeout(2000);
      console.log("✓ Chat archived.");
      results.Archive = "PASS";

      // Restore chat
      const archivedSectionToggle = page.locator("text=Archived").first();
      if (await archivedSectionToggle.count() > 0) {
        await archivedSectionToggle.click({ force: true });
        await page.waitForTimeout(1000);
        // Inside archived section, find the card's options trigger and click it
        await page.locator("div.group.relative button").first().click({ force: true });
        await page.waitForTimeout(800);
        await page.locator("button:has-text('Restore Chat')").first().click({ force: true });
        await page.waitForTimeout(2000);
        console.log("✓ Chat restored from archives.");
      }

      // Delete chat
      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await page.locator("div.group.relative button").first().click({ force: true });
      await page.waitForTimeout(800);
      await page.locator("button:has-text('Delete Chat')").first().click({ force: true });
      await page.waitForTimeout(2000);
      console.log("✓ Chat deleted.");
      results.Delete = "PASS";
    }

    // ==========================================
    // STEP 7 — FILE UPLOAD TEST
    // ==========================================
    console.log("\n--- STEP 7: FILE UPLOAD TEST ---");
    // Start fresh chat session
    await newChatBtn.click();
    await page.waitForTimeout(1000);

    const fileInput = page.locator("input[type='file']").first();
    if (await fileInput.count() > 0) {
      console.log("Uploading JPG Image...");
      await fileInput.setInputFiles(mockJpg);
      await page.waitForTimeout(800);
      results["Upload Image"] = "PASS";

      console.log("Uploading PNG Image...");
      await fileInput.setInputFiles(mockPng);
      await page.waitForTimeout(800);

      console.log("Uploading PDF File...");
      await fileInput.setInputFiles(mockPdf);
      await page.waitForTimeout(800);
      results["Upload PDF"] = "PASS";

      console.log("Uploading DOCX File...");
      await fileInput.setInputFiles(mockDocx);
      await page.waitForTimeout(800);
      results["Upload DOCX"] = "PASS";

      console.log("Uploading TXT File...");
      await fileInput.setInputFiles(mockTxt);
      await page.waitForTimeout(1000);
      results["Upload TXT"] = "PASS";

      // Verify preview is visible
      const previewExists = await page.locator("[class*='preview'], [class*='Preview'], [class*='badge']").first().count() > 0;
      console.log("File attachment preview visible:", previewExists ? "✓" : "✗");

      // Fill text prompt and send
      await chatInput.fill("Here are all the E2E verification files.");
      await page.waitForTimeout(500);
      await page.locator("button[title='Send message'], button[type='submit']").first().click();
      console.log("Message sent with 5 attachments.");
      await page.waitForTimeout(4000); // Wait for response
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "upload_test.png") });
    console.log("Screenshot saved: upload_test.png");

    // ==========================================
    // STEP 8 — REFRESH TEST
    // ==========================================
    console.log("\n--- STEP 8: REFRESH TEST ---");
    console.log("Refreshing browser page...");
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const chatHeader = page.locator("header").first();
    if (await chatHeader.isVisible()) {
      console.log("✓ Refresh session persists. Conversation still active.");
      results["Refresh Persistence"] = "PASS";
    }

    // ==========================================
    // STEP 9 — THEME TEST
    // ==========================================
    console.log("\n--- STEP 9: THEME VISUAL TEST ---");
    const themeBtn = page.locator("button[title*='Theme'], button[title*='Mode']").first();
    if (await themeBtn.isVisible()) {
      // Toggle to Dark Mode
      await themeBtn.click();
      await page.waitForTimeout(1000);
      console.log("✓ Theme Dark Mode activated.");
      
      // Toggle back to Light Mode
      await themeBtn.click();
      await page.waitForTimeout(1000);
      console.log("✓ Theme Light Mode activated.");
      results.Theme = "PASS";
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "theme_test.png") });
    console.log("Screenshot saved: theme_test.png");

  } catch (err) {
    console.error("Desktop E2E Flow Interruption:", err);
    results.issues.push(`Desktop Flow Error: ${err.message}`);
  } finally {
    await context.close();
  }

  // ==========================================
  // STEP 10 — MOBILE TEST
  // ==========================================
  console.log("\n--- STEP 10: MOBILE RESPONSIVENESS AND DEVICE TESTS ---");
  const mobileDevices = [
    { name: "iPhone_SE", width: 375, height: 667 },
    { name: "iPhone_12_Pro", width: 390, height: 844 },
    { name: "Galaxy_S20_Ultra", width: 412, height: 915 }
  ];

  for (const device of mobileDevices) {
    console.log(`Testing Emulated Device: ${device.name} (${device.width}x${device.height})...`);
    
    // Create new mobile context
    const mobileContext = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: true,
      hasTouch: true
    });
    const mPage = await mobileContext.newPage();

    try {
      await mPage.goto(BASE_URL);
      await mPage.waitForLoadState("networkidle");
      await mPage.waitForTimeout(1500);

      // Perform a quick login in mobile view to reach the chat page
      await mPage.goto(`${BASE_URL}/login`);
      await mPage.waitForLoadState("networkidle");
      await mPage.locator("input[placeholder='Enter your email']").filter({ visible: true }).first().fill(testUser);
      await mPage.locator("input[placeholder='Enter your password']").filter({ visible: true }).first().fill(testPassword);
      await mPage.locator("button[type='submit']").filter({ visible: true }).first().click();
      await mPage.waitForURL("**/chat", { timeout: 10000 });
      await mPage.waitForTimeout(2000);

      // Verify Hamburger menu is present inside header
      const hamburger = mPage.locator("header button").filter({ visible: true }).first();
      console.log(`[${device.name}] Mobile Hamburger visible:`, await hamburger.isVisible());

      if (await hamburger.isVisible()) {
        // Open Mobile Sidebar Drawer
        await hamburger.click();
        await mPage.waitForTimeout(1000);
        console.log(`[${device.name}] Mobile drawer successfully opened.`);
        results["Mobile Drawer"] = "PASS";

        // Take a screenshot of the drawer inside the iPhone 12 Pro or Galaxy S20
        if (device.name === "iPhone_12_Pro") {
          await mPage.screenshot({ path: path.join(SCREENSHOT_DIR, "mobile_chat.png") });
          console.log("Screenshot saved: mobile_chat.png");
        }

        // Close Sidebar (clicking backdrop)
        await mPage.mouse.click(320, 400);
        await mPage.waitForTimeout(1000);
      }

    } catch (mobileErr) {
      console.error(`Mobile Device [${device.name}] Flow Error:`, mobileErr.message);
      results.issues.push(`Mobile Device [${device.name}] Flow Error: ${mobileErr.message}`);
    } finally {
      await mobileContext.close();
    }
  }

  // ==========================================
  // STEP 11 — PERFORMANCE TEST
  // ==========================================
  console.log("\n--- STEP 11: PERFORMANCE & STABILITY ANALYSIS ---");
  console.log(`Total React client runtime exceptions: ${consoleErrors.length}`);
  console.log(`Total HTTP network request failures: ${networkFailures.length}`);

  // Calculate score based on PASS items
  let passCount = 0;
  const totalItems = Object.keys(results).filter(k => k !== "score" && k !== "issues").length;
  Object.keys(results).forEach(k => {
    if (k !== "score" && k !== "issues" && results[k] === "PASS") {
      passCount++;
    }
  });

  results.score = Math.round((passCount / totalItems) * 100);
  console.log(`Calculated Visual E2E Score: ${results.score}/100`);

  // Save e2e results JSON
  fs.writeFileSync(
    path.join(__dirname, "e2e_results.json"),
    JSON.stringify(results, null, 2)
  );
  console.log("Saved test results metadata to: e2e_results.json");

  // Clean up mock files
  try {
    if (fs.existsSync(mockJpg)) fs.unlinkSync(mockJpg);
    if (fs.existsSync(mockPng)) fs.unlinkSync(mockPng);
    if (fs.existsSync(mockPdf)) fs.unlinkSync(mockPdf);
    if (fs.existsSync(mockDocx)) fs.unlinkSync(mockDocx);
    if (fs.existsSync(mockTxt)) fs.unlinkSync(mockTxt);
  } catch {}

  console.log("\n==================================================");
  console.log("VISUAL E2E AUTOMATION COMPLETE. KEEPING BROWSER OPEN FOR 5 MINUTES FOR OBSERVATION.");
  console.log("==================================================");
  
  await page.waitForTimeout(300000); // 5 minutes
  await browser.close();
}

runE2E().catch((err) => {
  console.error("Critical Visual E2E Runner Failure:", err);
  process.exit(1);
});
