require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const { performance } = require('perf_hooks');

function now() {
  return new Date().toISOString();
}

(async () => {
  let browser;
  const logs = [];

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage();

    // Console log จากหน้าเว็บ
    page.on('console', msg => console.log(`[${now()}] PAGE LOG:`, msg.text()));

    // Response errors
    page.on('response', async response => {
      if (!response.ok()) {
        const body = await response.text();
        console.log(`[${now()}] ❗ RESPONSE ERROR (${response.status()}) ${response.url()}:\n${body}`);
      }
    });

    // เริ่มวัดเวลาโหลดหน้า
    const loadStart = performance.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const loadEnd = performance.now();
    const pageLoadTime = (loadEnd - loadStart).toFixed(2);
    logs.push(`📅 Timestamp: ${now()}`);
    logs.push(`🚀 Page Load Time: ${pageLoadTime} ms`);

    // รอและกรอกฟอร์ม
    await page.waitForSelector('#username');
    await page.waitForSelector('#password');
    await page.type('#username', process.env.LOGIN_USERNAME);
    await page.type('#password', process.env.LOGIN_PASSWORD);
    await new Promise(r => setTimeout(r, 800)); // ชะลอให้เห็น

    // Login
    const loginStart = performance.now();
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    const loginEnd = performance.now();
    const loginTime = (loginEnd - loginStart).toFixed(2);
    logs.push(`🔐 Login Time: ${loginTime} ms`);

    // ตรวจสอบผลลัพธ์
    const currentUrl = page.url();
    const success = currentUrl.includes('/admin');
    const result = success ? '✅ Login test passed!' : '❌ Login test failed!';
    logs.push(`📌 Result: ${result}`);
    logs.push(`🌐 Final URL: ${currentUrl}`);

    // แสดงผลใน console
    console.log('\n' + logs.join('\n') + '\n');

    // เขียน log ลงไฟล์
    const logFile = 'Login_performance_log.txt';
    fs.writeFileSync(logFile, logs.join('\n'), 'utf8');
    console.log(`📝 Log saved to ${logFile}\n`);
  } catch (error) {
    const errMsg = `[${now()}] ❌ Unexpected error: ${error.message}`;
    console.error(errMsg);
    fs.writeFileSync('login_performance_log.txt', errMsg, 'utf8');
  } finally {
    await browser?.close();
  }
})();
