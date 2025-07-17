require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

// 🔧 ฟังก์ชันคืนวันที่และเวลาในรูปแบบ วัน/เดือน/ปี ชั่วโมง:นาที:วินาที
function now() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// ชื่อไฟล์ log (เขียนทับทุกครั้ง)
const logFilename = 'Detail_performance_log.txt';

(async () => {
  const log = [];
  let browser;

  try {
    // เปิด browser แบบไม่ซ่อนหน้า
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage();

    // เริ่มจับเวลาการโหลดหน้าเว็บ
    const startLoad = Date.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const pageLoadTime = Date.now() - startLoad;
    log.push(`📅 Timestamp: ${now()}`);
    log.push(`🚀 Page Load Time: ${pageLoadTime} ms`);

    // กรอกแบบฟอร์ม login
    const startLogin = Date.now();
    await page.type('#username', process.env.LOGIN_USERNAME);
    await page.type('#password', process.env.LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const loginTime = Date.now() - startLogin;
    log.push(`🔐 Login Time: ${loginTime} ms`);
    log.push(`✅ Login success: ${page.url()}`);

    // รอให้ปุ่ม Create ปรากฏแล้วคลิก
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent.trim(), btn);
      if (text === 'Create') {
        await btn.click();
        log.push('🟢 Clicked "Create" button');
        break;
      }
    }

    // รอกล่องกรอกข้อมูลขึ้น
    await page.waitForSelector('input[placeholder="Enter username"]');
    const username = 'testuser_' + Date.now();
    const password = 'testpassword123';

    const startCreate = Date.now();
    await page.type('input[placeholder="Enter username"]', username);
    await page.type('input[placeholder="Enter password"]', password);

    // เลือก option แรกใน combobox ทุกอัน
    const comboboxes = await page.$$('[role="combobox"]');
    for (const box of comboboxes) {
      await box.click();
      await page.waitForSelector('[role="option"]');
      const options = await page.$$('[role="option"]');
      if (options.length > 0) {
        await options[0].click();
      }
    }

    // คลิก Create ใน dialog ถ้ามี
    const dialog = await page.$('[role="dialog"], .MuiDialog-root');
    if (dialog) {
      const dialogButtons = await dialog.$$('button');
      for (const btn of dialogButtons) {
        const text = await page.evaluate(el => el.textContent.trim(), btn);
        if (text === 'Create') {
          await btn.click();
          log.push('🟢 Clicked "Create" button in dialog');
          break;
        }
      }
    }

    // รอให้ user ปรากฏในตาราง
    await page.waitForFunction(
      username => [...document.querySelectorAll('td')].some(td => td.textContent.includes(username)),
      { timeout: 5000 },
      username
    );
    const createTime = Date.now() - startCreate;
    log.push(`👤 Create User Time: ${createTime} ms`);
    log.push(`👤 New Username: ${username}`);
    log.push(`✅ User created successfully`);

    // รอให้ dialog ปิดก่อนคลิก Detail
    try {
      await page.waitForSelector('.MuiDialog-root, [role="dialog"]', { hidden: true, timeout: 3000 });
    } catch {}

    await new Promise(res => setTimeout(res, 500)); // รอเล็กน้อยก่อนคลิก Detail

    const startDetail = Date.now();

    // คลิกปุ่ม Detail ของ user ที่เพิ่งสร้าง
    const clicked = await page.evaluate(username => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if ([...row.querySelectorAll('td')].some(td => td.textContent.includes(username))) {
          const btn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.trim() === 'Detail');
          if (btn) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    }, username);

    if (!clicked) throw new Error('ไม่พบปุ่ม Detail ในแถวของ user');

    const detailTime = Date.now() - startDetail;
    log.push(`🔎 Detail Button Click Time: ${detailTime} ms`);
    log.push(`🌐 Final URL: ${page.url()}`);

    // เขียน log ลงไฟล์แบบเขียนทับ
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 Log saved to', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    const errorLog = `[${now()}] ❌ Unexpected error: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await browser?.on();
  }
})();
