require('dotenv').config();
const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');
const fs = require('fs');

console.log('Loaded ENV:');
console.log('APP_URL:', process.env.APP_URL);
console.log('USERNAME:', process.env.LOGIN_USERNAME);
console.log('PASSWORD:', process.env.LOGIN_PASSWORD);

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const metrics = {};

  // จับเวลาเริ่มเข้าเว็บ
  const gotoStart = performance.now();
  await page.goto(process.env.APP_URL, { waitUntil: 'load' });
  const gotoEnd = performance.now();
  metrics.pageLoadTime = (gotoEnd - gotoStart).toFixed(2);

  // รอให้ input username และ password ปรากฏก่อน
  await page.waitForSelector('#username');
  await page.waitForSelector('#password');

  // กรอกข้อมูลจาก env
  console.log(process.env.LOGIN_USERNAME, process.env.LOGIN_PASSWORD);
  await page.type('#username', process.env.LOGIN_USERNAME);
  await page.type('#password', process.env.LOGIN_PASSWORD);

  await new Promise(resolve => setTimeout(resolve, 1000)); // พักไว้ให้เห็นก่อน Login

  // จับเวลา Login
  const loginStart = performance.now();
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);
  const loginEnd = performance.now();
  metrics.loginTime = (loginEnd - loginStart).toFixed(2);

  // ตรวจสอบผลลัพธ์
  const url = page.url();
  metrics.result = url.includes('/admin') ? '✅ Login test passed!' : '❌ Login test failed!';

  console.log('\n📊 ผลการวัดประสิทธิภาพ:');
  console.log(`- Page Load Time: ${metrics.pageLoadTime} ms`);
  console.log(`- Login Time: ${metrics.loginTime} ms`);
  console.log(`- Result: ${metrics.result}`);

  // เขียนผลลัพธ์ลงไฟล์ (ชื่อจาก .env ถ้ามี)
  const outputFile = process.env.OUTPUT_FILE || 'login_performance_result.json';
  fs.writeFileSync(outputFile, JSON.stringify(metrics, null, 2));

  // await browser.close();
})();
