require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

// 🔧 ฟังก์ชันคืนวันที่และเวลาในรูปแบบ วัน/เดือน/ปี ชั่วโมง:นาที:วินาที
function now() {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

const logFilename = 'Project_Create_log.txt';

(async () => {
  const log = [];
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage();

    const startLoad = Date.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const pageLoadTime = Date.now() - startLoad;
    log.push(`📅 เวลา: ${now()}`);
    log.push(`🚀 Page Load Time: ${pageLoadTime} ms`);

    const startLogin = Date.now();
    await page.type('#username', process.env.LOGIN_USERNAME);
    await page.type('#password', process.env.LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const loginTime = Date.now() - startLogin;
    log.push(`🔐 Login Time: ${loginTime} ms`);
    log.push(`✅ Login success: ${page.url()}`);

    // =================== นำทางไปยังหน้า Project ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 Navigating to Project page...');
    
    await page.goto(`${process.env.APP_URL}/adminproject`, { waitUntil: 'networkidle0' });
    
    log.push(`🔍 Current URL: ${page.url()}`);
    if (page.url().includes('/adminproject')) {
      log.push('✅ Successfully navigated to Project page');
    } else {
      throw new Error('Failed to navigate to Project page');
    }

    // =================== เริ่มการทดสอบการสร้างโปรเจกต์ ===================
    const startCreate = Date.now();
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 Looking for Create button...');

    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.includes('Create'));
    }, { timeout: 5000 });

    await page.$$eval('button', buttons => {
      const createButton = buttons.find(btn => btn.textContent.includes('Create'));
      if (createButton) {
        createButton.click();
        return true;
      }
      return false;
    });

    log.push('🟢 Clicked Create button');

    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    log.push('✅ Create Project dialog opened');

    const projectName = `Test Project ${Date.now()}`;
    await page.type('[placeholder="Enter project name"]', projectName);
    log.push(`📝 Entered Project Name: ${projectName}`);



    await page.type('[placeholder="Enter budget"]', '10000');
    log.push('📝 Entered Budget: 10,000');

    // await page.type('[placeholder="Enter actual"]', '5000');
    // log.push('📝 Entered Actual: 5,000');

    const today = new Date();
    const startDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    await page.type('input[type="date"]', startDate);
    log.push(`📝 Entered Start Date: ${startDate}`);

    today.setMonth(today.getMonth() + 1);
    const endDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    await page.$$eval('input[type="date"]', inputs => {
      if (inputs.length > 1) inputs[1].focus();
    });
    await page.keyboard.type(endDate);
    log.push(`📝 Entered End Date: ${endDate}`);

    const saveStart = Date.now();
    try {
      await page.$$eval('button', buttons => {
        const saveButton = buttons.find(btn => btn.textContent.includes('Save'));
        if (saveButton) {
          saveButton.click();
          return true;
        }
        return false;
      });

      log.push('🟢 Clicked Save button');
    } catch (e) {
      log.push(`⚠️ Could not click Save button: ${e.message}`);
    }

    try {
      await page.waitForFunction(
        () => !document.querySelector('[role="dialog"]'),
        { timeout: 5000 }
      );
      log.push('✅ Dialog closed after save');
    } catch (e) {
      log.push(`⚠️ Dialog did not close: ${e.message}`);
    }

    try {
      await page.waitForFunction(
        (expectedProject) => {
          const cells = document.querySelectorAll('td');
          return Array.from(cells).some(cell => cell.textContent.includes(expectedProject));
        },
        { timeout: 5000 },
        projectName
      );

      log.push('✅ New project appears in the table');
    } catch (e) {
      log.push(`⚠️ New project not found in table: ${e.message}`);
    }

    const createTime = Date.now() - startCreate;
    log.push(`⏱️ Total Create Project Time: ${createTime} ms`);
    log.push(`🌐 Final URL: ${page.url()}`);

    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 Log saved to', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    const errorLog = `📅 เวลา: ${now()} ❌ Unexpected error: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await browser?.close();
  }
})();
