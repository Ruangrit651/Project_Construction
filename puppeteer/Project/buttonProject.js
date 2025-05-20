require('dotenv').config(); // โหลด environment variables จากไฟล์ .env
const puppeteer = require('puppeteer'); // เรียกใช้งาน Puppeteer สำหรับควบคุมเบราว์เซอร์
const fs = require('fs'); // ใช้สำหรับบันทึก log ลงไฟล์

// ฟังก์ชันคืนค่า timestamp ปัจจุบันในรูปแบบ วัน/เดือน/ปี เวลา:นาที:วินาที
function now() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
}

const logFilename = 'Project_Button_log.txt'; // ตั้งชื่อไฟล์ log

(async () => {
  const log = [];
  let browser;

  try {
    // เปิดเบราว์เซอร์ (ไม่เป็น headless เพื่อดูการทำงาน)
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage(); // เปิดแท็บใหม่

    // โหลดหน้าแรกของระบบ
    const startLoad = Date.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const pageLoadTime = Date.now() - startLoad;
    log.push(`📅 Timestamp: ${now()}`);
    log.push(`🚀 Page Load Time: ${pageLoadTime} ms`);

    // กรอกข้อมูล login
    const startLogin = Date.now();
    await page.type('#username', process.env.LOGIN_USERNAME); // กรอก username
    await page.type('#password', process.env.LOGIN_PASSWORD); // กรอก password
    await page.click('button[type="submit"]'); // คลิกปุ่มเข้าสู่ระบบ
    await page.waitForNavigation({ waitUntil: 'networkidle0' }); // รอโหลดหน้าเสร็จ
    const loginTime = Date.now() - startLogin;
    log.push(`📅 Timestamp: ${now()}`);
    log.push(`🔐 Login Time: ${loginTime} ms`);
    log.push(`✅ Login success: ${page.url()}`);

    // ----------------- เริ่มคลิกแท็บ Project ------------------

    log.push(`📅 Timestamp: ${now()}`);
    log.push(`🔍 Current URL before clicking Project tab: ${page.url()}`);
    if (page.url().includes('/admin') && !page.url().includes('/adminproject')) {
      log.push('✅ Currently on Member page as expected');
    } else {
      log.push('⚠️ Not on expected Member page');
    }

    log.push('🔄 Attempting to click on Project tab...');
    const startProjectTabClick = Date.now();

    // วิธี 1: ใช้ role="tab" หาปุ่มที่มีคำว่า "Project"
    try {
      await page.waitForFunction(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        return tabs.some(tab => tab.textContent.includes('Project'));
      }, { timeout: 5000 });

      await page.$$eval('[role="tab"]', tabs => {
        const projectTab = tabs.find(tab => tab.textContent.includes('Project'));
        if (projectTab) {
          projectTab.click();
          return true;
        }
        return false;
      });

      log.push('✅ Clicked Project tab using direct selection');
    } catch (e) {
      log.push(`⚠️ Direct click failed: ${e.message}`);
    }

    // รอให้ URL เปลี่ยนหรือโหลดข้อมูล
    await new Promise(resolve => setTimeout(resolve, 2000));

    // หาก URL ยังไม่เปลี่ยน ให้เข้าโดยตรง
    if (!page.url().includes('/adminproject')) {
      log.push('🔄 Using direct navigation to /adminproject as fallback');
      await page.goto(`${process.env.APP_URL}/adminproject`, { waitUntil: 'networkidle0' });
    }

    const projectTabClickTime = Date.now() - startProjectTabClick;
    log.push(`📅 Timestamp: ${now()}`);
    log.push(`⏱️ Project Tab Click Time: ${projectTabClickTime} ms`);

    // ตรวจสอบว่าอยู่หน้า Project แล้ว
    log.push(`🔍 Current URL after attempts: ${page.url()}`);
    if (page.url().includes('/adminproject')) {
      log.push('✅ Successfully navigated to Project page');
    } else {
      log.push('⚠️ Failed to navigate to Project page');
    }

    // ดึงเนื้อหาบางส่วนจากหน้า Project
    const projectPageContent = await page.evaluate(() => {
      const title = document.querySelector('h1, h2, h3')?.textContent || 'No title found';
      const hasTable = !!document.querySelector('table');
      const buttonTexts = Array.from(document.querySelectorAll('button'))
        .map(btn => btn.textContent.trim())
        .filter(text => text.length > 0);

      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const projectTab = tabs.find(tab => tab.textContent.includes('Project'));

      const projectTabActive = projectTab && (
        projectTab.getAttribute('aria-selected') === 'true' ||
        projectTab.classList.contains('active') ||
        window.getComputedStyle(projectTab).borderBottomColor.includes('rgb(59, 130, 246)') ||
        projectTab.querySelector('.text-blue-400')
      );

      return {
        title,
        hasTable,
        buttonTexts,
        projectTabActive,
        url: window.location.href
      };
    });

    // เขียน log ลงไฟล์
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 Log saved to', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    const errorLog = `📅 Timestamp: ${now()} ❌ Unexpected error: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await browser?.close(); // ปิดเบราว์เซอร์เมื่อเสร็จสิ้น
  }
})();
